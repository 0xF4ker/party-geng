import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const orderRouter = createTRPCRouter({
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
          gigId: quote.gigId,
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
        gig: {
          include: {
            service: true,
          },
        },
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
          gig: {
            include: {
              service: true,
            },
          },
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
          gig: {
            include: {
              service: true,
            },
          },
          conversation: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),
});
