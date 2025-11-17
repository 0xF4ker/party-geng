/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY ?? undefined;

// Do not construct the Paystack client at module scope to avoid unsafe construction;
// create or use HTTP calls inside procedures where the secret key is validated.

export const paymentRouter = createTRPCRouter({
  getWallet: protectedProcedure.query(async ({ ctx }) => {
    // Create wallet if it doesn't exist
    let wallet = await ctx.db.wallet.findUnique({
      where: { userId: ctx.user.id },
    });

    wallet ??= await ctx.db.wallet.create({
      data: {
        userId: ctx.user.id,
      },
    });

    return wallet;
  }),

  // Initialize Paystack payment
  initializePayment: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(100), // Minimum 100 naira
        email: z.string().email(),
        reference: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecretKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Paystack configuration error",
        });
      }

      const reference = input.reference ?? `pg_${Date.now()}_${ctx.user.id}`;

      try {
        const response = await fetch(
          "https://api.paystack.co/transaction/initialize",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${paystackSecretKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: Math.round(input.amount * 100), // Convert to kobo
              email: input.email,
              reference,
              callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/callback`,
              metadata: {
                user_id: ctx.user.id,
                type: "wallet_topup",
              },
            }),
          },
        );

        const data = await response.json();

        if (!data.status) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: data.message ?? "Payment initialization failed",
          });
        }

        return {
          authorization_url: data.data.authorization_url,
          reference: data.data.reference,
        };
      } catch (error) {
        console.error("Paystack initialization error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initialize payment",
        });
      }
    }),

  // Verify Paystack payment
  verifyPayment: protectedProcedure
    .input(
      z.object({
        reference: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecretKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Paystack configuration error",
        });
      }

      try {
        const response = await fetch(
          `https://api.paystack.co/transaction/verify/${input.reference}`,
          {
            headers: {
              Authorization: `Bearer ${paystackSecretKey}`,
            },
          },
        );

        const data = await response.json();

        if (!data.status || data.data.status !== "success") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment verification failed",
          });
        }

        const amount = data.data.amount / 100; // Convert from kobo to naira
        const userId = data.data.metadata.user_id;

        // Ensure the payment is for this user
        if (userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Payment verification failed",
          });
        }

        // Update wallet balance
        const wallet = await ctx.db.wallet.upsert({
          where: { userId: ctx.user.id },
          create: {
            userId: ctx.user.id,
            availableBalance: amount,
          },
          update: {
            availableBalance: {
              increment: amount,
            },
          },
        });

        // Create transaction record
        await ctx.db.transaction.create({
          data: {
            walletId: wallet.id,
            type: "PAYMENT",
            amount,
            status: "COMPLETED",
            description: `Wallet top-up via Paystack - ${input.reference}`,
          },
        });

        return {
          success: true,
          amount,
          newBalance: wallet.availableBalance + amount,
        };
      } catch (error) {
        console.error("Payment verification error:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payment verification failed",
        });
      }
    }),

  // Get transaction history
  getTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const wallet = await ctx.db.wallet.findUnique({
        where: { userId: ctx.user.id },
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: input.limit,
            skip: input.offset,
            include: {
              order: {
                include: {
                  quote: true,
                },
              },
            },
          },
        },
      });

      return wallet?.transactions ?? [];
    }),

  // Withdraw funds (for vendors)
  initiateWithdrawal: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1000), // Minimum 1000 naira withdrawal
        bankCode: z.string(),
        accountNumber: z.string(),
        accountName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const wallet = await ctx.db.wallet.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!wallet || wallet.availableBalance < input.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient balance",
        });
      }

      // In a real implementation, you would:
      // 1. Integrate with Paystack Transfer API
      // 2. Verify bank details
      // 3. Process the withdrawal
      // For now, we'll just create a pending transaction

      await ctx.db.wallet.update({
        where: { userId: ctx.user.id },
        data: {
          availableBalance: {
            decrement: input.amount,
          },
        },
      });

      await ctx.db.transaction.create({
        data: {
          walletId: wallet.id,
          type: "PAYOUT",
          amount: -input.amount,
          status: "PENDING",
          description: `Withdrawal to ${input.accountName} - ${input.accountNumber}`,
        },
      });

      return { success: true };
    }),
});
