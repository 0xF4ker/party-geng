import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { OrderStatus, NotificationType, type Prisma } from "@prisma/client";
import { logActivity } from "../services/activityLogger";

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
          createdAt: "desc",
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

      const isAdmin = ["ADMIN", "SUPPORT", "FINANCE"].includes(ctx.user.role);

      if (
        !isAdmin &&
        order.clientId !== ctx.user.id &&
        order.vendorId !== ctx.user.id
      ) {
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

      const order = await ctx.db.order.create({
        data: {
          vendorId: quote.vendorId,
          clientId: quote.clientId,
          quoteId: quote.id,
          amount: quote.price,
          eventDate: quote.eventDate,
        },
      });

      // No payment received notification here as payment is now separate

      return order;
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
        include: { quote: { select: { title: true } } },
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

      // NO ESCROW RELEASE HERE ANYMORE.
      // Payment is handled separately via transfers.

      return ctx.db.$transaction(async (prisma) => {
        // 1. Update order status
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.COMPLETED },
        });

        // 2. Notify vendor
        await prisma.notification.create({
          data: {
            userId: order.vendorId,
            type: NotificationType.ORDER_COMPLETED,
            message: `Your order for "${order.quote.title}" has been marked as complete by the client.`,
            link: `/orders/${order.id}`, // Link to order details
          },
        });

        return updatedOrder;
      });
    }),
  // --- NEW ADMIN PROCEDURES ---

  /**
   * Get All Orders (Admin)
   * Supports pagination, status filtering, and search by ID/Client/Vendor
   */
  getAllOrders: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        status: z.nativeEnum(OrderStatus).optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status, search } = input;

      const where: Prisma.OrderWhereInput = {
        status: status ?? undefined,
        OR: search
          ? [
              { id: { contains: search, mode: "insensitive" } },
              {
                client: { username: { contains: search, mode: "insensitive" } },
              },
              {
                vendor: { username: { contains: search, mode: "insensitive" } },
              },
              {
                vendor: {
                  vendorProfile: {
                    companyName: { contains: search, mode: "insensitive" },
                  },
                },
              },
            ]
          : undefined,
      };

      const items = await ctx.db.order.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            select: {
              username: true,
              email: true,
              clientProfile: { select: { name: true, avatarUrl: true } },
            },
          },
          vendor: {
            select: {
              username: true,
              email: true,
              vendorProfile: { select: { companyName: true, avatarUrl: true } },
            },
          },
          quote: { select: { title: true, price: true, eventDate: true } },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return { items, nextCursor };
    }),

  /**
   * Admin Force Update Order Status
   * Used for dispute resolution or manual cancellations
   */
  adminUpdateStatus: adminProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.nativeEnum(OrderStatus),
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      ctx.auditFlags.disabled = true;

      const { orderId, status, reason } = input;

      const order = await ctx.db.order.findUnique({ where: { id: orderId } });
      if (!order)
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

      const updated = await ctx.db.order.update({
        where: { id: orderId },
        data: { status },
      });

      // Log the admin action
      await logActivity({
        ctx,
        action: "ORDER_ADMIN_UPDATE",
        entityType: "ORDER",
        entityId: orderId,
        details: {
          previousStatus: order.status,
          newStatus: status,
          reason,
        },
      });

      // Notify parties (Simplified)
      const message = `Order #${orderId.slice(0, 8)} status changed to ${status} by Admin. Reason: ${reason}`;
      await ctx.db.notification.createMany({
        data: [
          {
            userId: order.clientId,
            type: NotificationType.ORDER_UPDATE,
            message,
            link: `/orders/${orderId}`,
          },
          {
            userId: order.vendorId,
            type: NotificationType.ORDER_UPDATE,
            message,
            link: `/orders/${orderId}`,
          },
        ],
      });

      return updated;
    }),
});
