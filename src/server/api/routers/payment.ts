import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  TransactionType,
  WishlistItemType,
  NotificationType,
  TransactionStatus,
  type Prisma,
} from "@prisma/client";
import { logActivity } from "../services/activityLogger";

// --- Types for Paystack Responses ---
interface PaystackBank {
  name: string;
  slug: string;
  code: string;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  id: number;
}

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface RecipientData {
  recipient_code: string;
  details: {
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
  };
}

interface TransferData {
  reference: string;
  amount: number;
  status: string;
  transfer_code: string;
}

interface TransferVerificationData {
  status: string; // "success", "failed", "pending"
  amount: number;
  reference: string;
  recipient: {
    details: {
      account_number: string;
      bank_name: string;
    };
  };
  failures: string | null;
}

// --- Helper for Error Handling ---
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error occurred";
}

// --- Helper to extract reference from description ---
// Matches "Ref: wd_..." pattern f
function extractReference(description: string | null): string | null {
  if (!description) return null;
  const match = /Ref:\s*(wd_[a-zA-Z0-9_-]+)/.exec(description);
  return match ? (match[1] ?? null) : null;
}

export const paymentRouter = createTRPCRouter({
  getWallet: protectedProcedure.query(async ({ ctx }) => {
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

  // --- GET SUPPORTED BANKS ---
  getBanks: protectedProcedure.query(async () => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Paystack configuration error",
      });
    }

    try {
      const response = await fetch(
        "https://api.paystack.co/bank?country=nigeria&currency=NGN",
        {
          headers: { Authorization: `Bearer ${secret}` },
        },
      );

      // Safe casting using the interface
      const data = (await response.json()) as PaystackResponse<PaystackBank[]>;

      if (!data.status) {
        throw new Error("Failed to fetch banks from Paystack");
      }

      return data.data.map((bank) => ({
        name: bank.name,
        code: bank.code,
        slug: bank.slug,
      }));
    } catch (error) {
      console.error("Get Banks Error:", error);
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: "Could not fetch bank list",
      });
    }
  }),

  // Transfer funds to another user
  transferFunds: protectedProcedure
    .input(
      z.object({
        recipientUsername: z.string(),
        amount: z.number().min(100),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { recipientUsername, amount, description } = input;
      const senderId = ctx.user.id;

      const senderWallet = await ctx.db.wallet.findUnique({
        where: { userId: senderId },
      });

      if (!senderWallet || senderWallet.availableBalance < amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient funds.",
        });
      }

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

      let recipientWallet = recipient.wallet;
      recipientWallet ??= await ctx.db.wallet.create({
        data: { userId: recipient.id },
      });

      return ctx.db.$transaction(async (prisma) => {
        await prisma.wallet.update({
          where: { userId: senderId },
          data: { availableBalance: { decrement: amount } },
        });

        await prisma.wallet.update({
          where: { userId: recipient.id },
          data: { availableBalance: { increment: amount } },
        });

        const senderTx = await prisma.transaction.create({
          data: {
            walletId: senderWallet.id,
            type: TransactionType.TRANSFER,
            amount: -amount,
            status: "COMPLETED",
            description: description ?? `Transfer to @${recipient.username}`,
          },
        });

        await prisma.notification.create({
          data: {
            userId: recipient.id,
            type: NotificationType.QUOTE_PAYMENT_RECEIVED,
            message: `You received ₦${amount.toLocaleString()} from @${ctx.user.username}.`,
            link: `/wallet`,
          },
        });

        return { success: true, transactionId: senderTx.id };
      });
    }),

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

      await ctx.db.notification.create({
        data: {
          userId: payer.id,
          type: NotificationType.PAYMENT_REQUEST,
          message: `@${ctx.user.username} is requesting ₦${amount.toLocaleString()}: ${description ?? "No description"}`,
          link: `/wallet?modal=transfer&recipient=${ctx.user.username}&amount=${amount}`,
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
        await prisma.wallet.update({
          where: { userId: contributorId },
          data: { availableBalance: { decrement: amount } },
        });

        await prisma.wallet.update({
          where: { userId: recipientId },
          data: { availableBalance: { increment: amount } },
        });

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
        amount: z.number().min(100),
        email: z.string().email(),
        reference: z.string().optional(),
        metadata: z.record(z.unknown()).optional(), // Changed z.any() to z.unknown() for safety
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
              amount: Math.round(input.amount * 100),
              email: input.email,
              reference,
              callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/callback`,
              metadata: {
                user_id: ctx.user.id,
                type: "wallet_topup",
                ...input.metadata,
              },
            }),
          },
        );

        // Safe cast response
        const data = (await response.json()) as PaystackResponse<{
          authorization_url: string;
          access_code: string;
          reference: string;
        }>;

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

        // Strongly typed verification response structure
        const data = (await response.json()) as PaystackResponse<{
          status: string;
          amount: number;
          metadata: {
            user_id: string;
            quote_id?: string;
          };
        }>;

        if (!data.status || data.data.status !== "success") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment verification failed",
          });
        }

        const amount = data.data.amount / 100; // Convert from kobo
        const metadata = data.data.metadata;
        const userId = metadata.user_id;

        if (userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Payment verification failed",
          });
        }

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

        await ctx.db.transaction.create({
          data: {
            walletId: wallet.id,
            type: "TOPUP",
            amount,
            status: "COMPLETED",
            description: `Wallet top-up via Paystack - ${input.reference}`,
          },
        });

        const quoteId = metadata.quote_id;

        return {
          success: true,
          amount,
          newBalance: wallet.availableBalance,
          quoteId,
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

  // --- UPDATED: WITHDRAW FUNDS WITH PAYSTACK ---
  initiateWithdrawal: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1000),
        bankCode: z.string(),
        accountNumber: z.string(),
        accountName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Paystack config missing",
        });
      }

      const wallet = await ctx.db.wallet.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!wallet || wallet.availableBalance < input.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient balance",
        });
      }

      let recipientCode = "";
      try {
        const recipResponse = await fetch(
          "https://api.paystack.co/transferrecipient",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${secret}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "nuban",
              name: input.accountName,
              account_number: input.accountNumber,
              bank_code: input.bankCode,
              currency: "NGN",
            }),
          },
        );

        const recipData =
          (await recipResponse.json()) as PaystackResponse<RecipientData>;
        if (!recipData.status) {
          throw new Error(
            recipData.message ?? "Failed to validate/create recipient",
          );
        }
        recipientCode = recipData.data.recipient_code;
      } catch (error: unknown) {
        console.error("Paystack Recipient Error:", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: getErrorMessage(error) ?? "Invalid bank details.",
        });
      }

      const reference = `wd_${Date.now()}_${ctx.user.id}`;
      let transferStatus = "PENDING";
      let transferMessage = "Transfer initiated";

      try {
        const transferResponse = await fetch(
          "https://api.paystack.co/transfer",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${secret}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              source: "balance",
              amount: Math.round(input.amount * 100),
              recipient: recipientCode,
              reference: reference,
              reason: "Withdrawal from PartyGeng Wallet",
            }),
          },
        );

        const transferData =
          (await transferResponse.json()) as PaystackResponse<TransferData>;

        if (!transferData.status) {
          throw new Error(transferData.message ?? "Transfer initiation failed");
        }

        if (transferData.data.status === "success") {
          transferStatus = "COMPLETED";
          transferMessage = "Transfer successful";
        } else {
          transferStatus = "PENDING";
        }
      } catch (error: unknown) {
        console.error("Paystack Transfer Error:", error);
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: getErrorMessage(error) ?? "Transfer failed at gateway.",
        });
      }

      return ctx.db.$transaction(async (prisma) => {
        await prisma.wallet.update({
          where: { userId: ctx.user.id },
          data: {
            availableBalance: {
              decrement: input.amount,
            },
          },
        });

        await prisma.transaction.create({
          data: {
            walletId: wallet.id,
            type: "PAYOUT",
            amount: -input.amount,
            status: transferStatus as TransactionStatus,
            description: `Withdrawal to ${input.accountName} (${input.accountNumber}) - Ref: ${reference}`,
          },
        });

        return { success: true, message: transferMessage };
      });
    }),
  adminGetStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalInflow,
      totalPayouts,
      pendingPayoutsCount,
      pendingPayoutsVolume,
    ] = await Promise.all([
      ctx.db.transaction.aggregate({
        where: { type: "TOPUP", status: "COMPLETED" },
        _sum: { amount: true },
      }),
      ctx.db.transaction.aggregate({
        where: { type: "PAYOUT", status: "COMPLETED" },
        _sum: { amount: true },
      }),
      ctx.db.transaction.count({
        where: { type: "PAYOUT", status: "PENDING" },
      }),
      ctx.db.transaction.aggregate({
        where: { type: "PAYOUT", status: "PENDING" },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalInflow: totalInflow._sum.amount ?? 0,
      totalPayouts: Math.abs(totalPayouts._sum.amount ?? 0),
      pendingPayoutsCount,
      pendingPayoutsVolume: Math.abs(pendingPayoutsVolume._sum.amount ?? 0),
    };
  }),

  adminGetAllTransactions: adminProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        cursor: z.string().nullish(),
        type: z.nativeEnum(TransactionType).optional(),
        status: z.nativeEnum(TransactionStatus).optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, type, status, search } = input;

      const where: Prisma.TransactionWhereInput = {
        type,
        status,
        wallet: search
          ? {
              user: {
                OR: [
                  { email: { contains: search, mode: "insensitive" } },
                  { username: { contains: search, mode: "insensitive" } },
                ],
              },
            }
          : undefined,
      };

      const items = await ctx.db.transaction.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  username: true,
                  email: true,
                  role: true,
                  vendorProfile: { select: { companyName: true } },
                  clientProfile: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return { items, nextCursor };
    }),

  // This can be used by admins to manually verify a pending transaction
  // or by a scheduled job to reconcile payments.
  checkWithdrawalStatus: adminProcedure
    .input(z.object({ transactionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Paystack config missing",
        });

      const transaction = await ctx.db.transaction.findUnique({
        where: { id: input.transactionId },
        include: { wallet: true },
      });

      if (!transaction)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaction not found",
        });
      if (transaction.type !== "PAYOUT")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not a payout transaction",
        });

      // Attempt to find reference in description
      const reference = extractReference(transaction.description);
      if (!reference) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Could not extract payment reference from transaction record.",
        });
      }

      try {
        const response = await fetch(
          `https://api.paystack.co/transfer/verify/${reference}`,
          {
            headers: { Authorization: `Bearer ${secret}` },
          },
        );

        const data =
          (await response.json()) as PaystackResponse<TransferVerificationData>;

        if (!data.status) {
          throw new Error(data.message ?? "Verification failed");
        }

        const paystackStatus = data.data.status; // "success", "failed", "pending"

        // 1. If Success -> Mark Completed
        if (
          paystackStatus === "success" &&
          transaction.status !== "COMPLETED"
        ) {
          await ctx.db.transaction.update({
            where: { id: transaction.id },
            data: { status: "COMPLETED" },
          });

          await ctx.db.notification.create({
            data: {
              userId: transaction.wallet.userId,
              type: NotificationType.PAYMENT_REQUEST,
              message: `Withdrawal of ₦${Math.abs(transaction.amount).toLocaleString()} confirmed successful.`,
              link: "/wallet",
            },
          });

          return {
            success: true,
            status: "COMPLETED",
            message: "Transfer verified as successful",
          };
        }

        // 2. If Failed/Reversed -> Refund Wallet
        if (
          (paystackStatus === "failed" || paystackStatus === "reversed") &&
          transaction.status !== "FAILED"
        ) {
          const failureReason = data.data.failures ?? "Transfer failed at bank";

          await ctx.db.$transaction(async (prisma) => {
            await prisma.transaction.update({
              where: { id: transaction.id },
              data: {
                status: "FAILED",
                description: `${transaction.description} | Failed: ${failureReason}`,
              },
            });

            await prisma.wallet.update({
              where: { id: transaction.walletId },
              data: {
                availableBalance: { increment: Math.abs(transaction.amount) },
              },
            });

            await prisma.notification.create({
              data: {
                userId: transaction.wallet.userId,
                type: NotificationType.PAYMENT_REQUEST,
                message: `Withdrawal failed: ${failureReason}. Funds returned to wallet.`,
                link: "/wallet",
              },
            });
          });

          return {
            success: true,
            status: "FAILED",
            message: `Transfer failed: ${failureReason}`,
          };
        }

        // 3. Still Pending
        return {
          success: true,
          status: "PENDING",
          message: "Transfer is still processing at the bank",
        };
      } catch (error: unknown) {
        console.error("Withdrawal Verification Error:", error);
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: getErrorMessage(error),
        });
      }
    }),

  adminProcessPayout: adminProcedure
    .input(
      z.object({
        transactionId: z.string(),
        action: z.enum(["APPROVE", "REJECT"]),
        rejectionReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      ctx.auditFlags.disabled = true;

      const { transactionId, action, rejectionReason } = input;

      const transaction = await ctx.db.transaction.findUnique({
        where: { id: transactionId },
        include: { wallet: true },
      });

      if (!transaction) throw new TRPCError({ code: "NOT_FOUND" });
      if (transaction.type !== "PAYOUT")
        throw new TRPCError({ code: "BAD_REQUEST", message: "Not a payout" });
      if (transaction.status !== "PENDING")
        throw new TRPCError({
          code: "CONFLICT",
          message: "Transaction already processed",
        });

      if (action === "APPROVE") {
        await ctx.db.transaction.update({
          where: { id: transactionId },
          data: { status: "COMPLETED" },
        });

        await ctx.db.notification.create({
          data: {
            userId: transaction.wallet.userId,
            type: NotificationType.PAYMENT_REQUEST,
            message: `Your withdrawal of ₦${Math.abs(transaction.amount).toLocaleString()} has been processed.`,
            link: "/wallet",
          },
        });

        await logActivity({
          ctx,
          action: "PAYOUT_APPROVE",
          entityType: "TRANSACTION",
          entityId: transactionId,
          details: {
            amount: transaction.amount,
            userId: transaction.wallet.userId,
          },
        });
      } else {
        return ctx.db.$transaction(async (prisma) => {
          const updatedTx = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: "FAILED",
              description: `Payout Rejected: ${rejectionReason}`,
            },
          });

          await prisma.wallet.update({
            where: { id: transaction.walletId },
            data: {
              availableBalance: { increment: Math.abs(transaction.amount) },
            },
          });

          await prisma.notification.create({
            data: {
              userId: transaction.wallet.userId,
              type: NotificationType.PAYMENT_REQUEST,
              message: `Withdrawal rejected: ${rejectionReason}. Funds returned to wallet.`,
              link: "/wallet",
            },
          });

          await logActivity({
            ctx,
            action: "PAYOUT_REJECT",
            entityType: "TRANSACTION",
            entityId: transactionId,
            details: { reason: rejectionReason },
          });

          return updatedTx;
        });
      }

      return { success: true };
    }),
});
