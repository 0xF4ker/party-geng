import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { OrderStatus, TransactionStatus } from "@prisma/client";

export const orderRouter = createTRPCRouter({
  getOrdersBetweenUsers: protectedProcedure
    .input(z.object({ userOneId: z.string(), userTwoId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userOneId, userTwoId } = input;
      
      // Ensure the current user is one of the two users
      if (ctx.user.id !== userOneId && ctx.user.id !== userTwoId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.order.findMany({
        where: {
          OR: [
            { clientId: userOneId, vendorId: userTwoId },
            { clientId: userTwoId, vendorId: userOneId },
          ],
        },
        include: {
          quote: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }),
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.id },
        include: {
          client: {
            select: {
              id: true,
              username: true,
              clientProfile: true,
            },
          },
          vendor: {
            select: {
              id: true,
              username: true,
              vendorProfile: true,
            },
          },
          quote: true,
        },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      }

      if (order.clientId !== ctx.user.id && order.vendorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view this order.",
        });
      }

      return order;
    }),

  createFromQuote: protectedProcedure
    .input(z.object({ quoteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.db.quote.findUnique({
        where: { id: input.quoteId },
      });

      if (!quote) {
        throw new Error("Quote not found");
      }

      return ctx.db.order.create({
        data: {
          vendorId: quote.vendorId,
          clientId: quote.clientId,
          quoteId: quote.id,
          amount: quote.price,
          eventDate: quote.eventDate,
        },
      });
    }),

  // Get active orders for vendor
  getMyActiveOrders: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.order.findMany({
      where: {
        vendorId: ctx.user.id,
        status: "ACTIVE",
      },
      include: {
        client: {
          select: {
            username: true,
            email: true,
            clientProfile: true,
          },
        },
        quote: true,
      },
      orderBy: {
        eventDate: "asc",
      },
    });
  }),

  // Get all orders for both vendor and client
  getMyOrders: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["ACTIVE", "COMPLETED", "CANCELLED", "IN_DISPUTE"])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const isVendor = ctx.user.role === "VENDOR";

      return ctx.db.order.findMany({
        where: {
          ...(isVendor ? { vendorId: ctx.user.id } : { clientId: ctx.user.id }),
          ...(input?.status ? { status: input.status } : {}),
        },
        include: {
          client: {
            select: {
              username: true,
              email: true,
              clientProfile: {
                select: {
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          vendor: {
            select: {
              id: true,
              username: true,
              email: true,
              vendorProfile: {
                select: {
                  companyName: true,
                  avatarUrl: true,
                  level: true,
                },
              },
            },
          },
          quote: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  // Get pending quotes (new leads for vendors)
  getMyQuotes: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["PENDING", "ACCEPTED", "REJECTED", "REVISION_REQUESTED"])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const isVendor = ctx.user.role === "VENDOR";

      return ctx.db.quote.findMany({
        where: {
          ...(isVendor ? { vendorId: ctx.user.id } : { clientId: ctx.user.id }),
          ...(input?.status ? { status: input.status } : {}),
        },
        include: {
          client: {
            select: {
              username: true,
              email: true,
              clientProfile: {
                select: {
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          vendor: {
            select: {
              username: true,
              email: true,
              vendorProfile: {
                select: {
                  companyName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          conversation: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
    
    completeOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { orderId } = input;
      const clientId = ctx.user.id;

      const order = await ctx.db.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      }

      if (order.clientId !== clientId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to complete this order.",
        });
      }

      if (order.status !== OrderStatus.ACTIVE) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Order is not active and cannot be completed.",
        });
      }

      const vendorWallet = await ctx.db.wallet.findUnique({
        where: { userId: order.vendorId },
      });

      if (!vendorWallet) {
        // This should ideally not happen if an order exists
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Vendor wallet not found.",
        });
      }
      
      const platformFee = 0; // For now, no platform fee.

      return ctx.db.$transaction(async (prisma) => {
        // 1. Update order status
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.COMPLETED },
        });

        // 2. Release funds from escrow to vendor's available balance
        await prisma.wallet.update({
          where: { userId: order.vendorId },
          data: {
            activeOrderBalance: { decrement: order.amount },
            availableBalance: { increment: order.amount - platformFee },
          },
        });
        
        // 3. Find the HELD transaction and mark it as COMPLETED
        await prisma.transaction.updateMany({
            where: {
                orderId: order.id,
                walletId: vendorWallet.id,
                status: TransactionStatus.HELD,
            },
            data: {
                status: TransactionStatus.COMPLETED,
            }
        });

        // TODO: Later, we can create another transaction for the platform fee.

        return updatedOrder;
      });
    }),
});
