/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  TransactionType,
  WishlistItemType,
  NotificationType,
} from "@prisma/client";

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

  // Transfer funds to another user
  transferFunds: protectedProcedure
    .input(
      z.object({
        recipientUsername: z.string(),
        amount: z.number().min(100), // Minimum transfer amount
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { recipientUsername, amount, description } = input;
      const senderId = ctx.user.id;

      // 1. Check sender's balance
      const senderWallet = await ctx.db.wallet.findUnique({
        where: { userId: senderId },
      });

      if (!senderWallet || senderWallet.availableBalance < amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient funds.",
        });
      }

      // 2. Find recipient
      const recipient = await ctx.db.user.findUnique({
        where: { username: recipientUsername },
        include: { wallet: true },
      });

      if (!recipient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recipient not found.",
        });
      }

      if (recipient.id === senderId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot transfer funds to yourself.",
        });
      }

      // Ensure recipient has a wallet
      let recipientWallet = recipient.wallet;
      recipientWallet ??= await ctx.db.wallet.create({
        data: { userId: recipient.id },
      });

      // 3. Execute Transfer
      return ctx.db.$transaction(async (prisma) => {
        // Debit sender
        await prisma.wallet.update({
          where: { userId: senderId },
          data: { availableBalance: { decrement: amount } },
        });

        // Credit recipient
        await prisma.wallet.update({
          where: { userId: recipient.id },
          data: { availableBalance: { increment: amount } },
        });

        // Create transactions
        const senderTx = await prisma.transaction.create({
          data: {
            walletId: senderWallet.id,
            type: TransactionType.TRANSFER,
            amount: -amount,
            status: "COMPLETED",
            description: description ?? `Transfer to @${recipient.username}`,
          },
        });

        // const recipientTx = await prisma.transaction.create({
        //   data: {
        //     walletId: recipientWallet.id,
        //     type: TransactionType.TRANSFER, // Or define a specific type like TRANSFER_RECEIVED
        //     amount: amount,
        //     status: "COMPLETED",
        //     description: description || `Transfer from @${ctx.user.username}`,
        //   },
        // });

        // Notify recipient
        await prisma.notification.create({
          data: {
            userId: recipient.id,
            type: NotificationType.QUOTE_PAYMENT_RECEIVED, // Re-using or should be generic payment received
            message: `You received ₦${amount.toLocaleString()} from @${ctx.user.username}.`,
            link: `/wallet`,
          },
        });

        return { success: true, transactionId: senderTx.id };
      });
    }),

  // Request funds from another user
  requestFunds: protectedProcedure
    .input(
      z.object({
        payerUsername: z.string(),
        amount: z.number().min(100),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { payerUsername, amount, description } = input;

      const payer = await ctx.db.user.findUnique({
        where: { username: payerUsername },
      });

      if (!payer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      if (payer.id === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot request funds from yourself.",
        });
      }

      // For now, we just send a notification.
      // In a more complex system, we might create a PaymentRequest model.
      await ctx.db.notification.create({
        data: {
          userId: payer.id,
          type: NotificationType.PAYMENT_REQUEST,
          message: `@${ctx.user.username} is requesting ₦${amount.toLocaleString()}: ${description ?? "No description"}`,
          link: `/wallet?modal=transfer&recipient=${ctx.user.username}&amount=${amount}`, // hypothetical link to pre-fill transfer
        },
      });

      return { success: true, message: "Request sent successfully." };
    }),

  contributeToWishlist: protectedProcedure
    .input(
      z.object({
        wishlistItemId: z.string(),
        amount: z.number().min(1),
        guestName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { wishlistItemId, amount, guestName } = input;
      const contributorId = ctx.user.id;

      const wishlistItem = await ctx.db.wishlistItem.findUnique({
        where: { id: wishlistItemId },
        include: {
          wishlist: {
            include: {
              event: {
                include: {
                  client: true,
                },
              },
            },
          },
        },
      });

      if (!wishlistItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Wishlist item not found.",
        });
      }

      if (wishlistItem.itemType !== WishlistItemType.CASH_REQUEST) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This item does not accept cash contributions.",
        });
      }

      const recipientId = wishlistItem.wishlist.event.client.userId;

      const contributorWallet = await ctx.db.wallet.findUnique({
        where: { userId: contributorId },
      });

      if (!contributorWallet || contributorWallet.availableBalance < amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient funds.",
        });
      }

      const recipientWallet = await ctx.db.wallet.findUnique({
        where: { userId: recipientId },
      });

      if (!recipientWallet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recipient wallet not found.",
        });
      }

      const contribution = await ctx.db.$transaction(async (prisma) => {
        // 1. Debit contributor
        await prisma.wallet.update({
          where: { userId: contributorId },
          data: { availableBalance: { decrement: amount } },
        });

        // 2. Credit recipient
        await prisma.wallet.update({
          where: { userId: recipientId },
          data: { availableBalance: { increment: amount } },
        });

        // 3. Create transactions
        await prisma.transaction.createMany({
          data: [
            {
              walletId: contributorWallet.id,
              type: TransactionType.GIFT,
              amount: -amount,
              status: "COMPLETED",
              description: `Gift for: ${wishlistItem.name}`,
            },
            {
              walletId: recipientWallet.id,
              type: TransactionType.GIFT,
              amount: amount,
              status: "COMPLETED",
              description: `Gift from ${guestName} for ${wishlistItem.name}`,
            },
          ],
        });

        // 4. Create WishlistContribution
        const newContribution = await prisma.wishlistContribution.create({
          data: {
            wishlistItemId: wishlistItemId,
            guestUserId: contributorId,
            guestName: guestName,
            type: "CASH",
            amount: amount,
          },
        });

        return newContribution;
      });

      return { success: true, contribution };
    }),

  // Initialize Paystack payment
  initializePayment: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(100), // Minimum 100 naira
        email: z.string().email(),
        reference: z.string().optional(),
        metadata: z.record(z.any()).optional(), // New: Added metadata
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
                ...input.metadata, // Pass through any additional metadata
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
        const metadata = data.data.metadata as {
          user_id: string;
          quote_id?: string;
        };
        const userId = metadata.user_id;

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
            type: "TOPUP",
            amount,
            status: "COMPLETED",
            description: `Wallet top-up via Paystack - ${input.reference}`,
          },
        });

        // Check if there's a quote ID in metadata to redirect for immediate payment
        const quoteId = metadata.quote_id;

        return {
          success: true,
          amount,
          newBalance: wallet.availableBalance,
          quoteId, // Return quoteId to client for redirection
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
