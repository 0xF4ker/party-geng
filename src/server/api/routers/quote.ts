import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { Prisma } from "@prisma/client";

export const quoteRouter = createTRPCRouter({
  // Create a new quote (vendor sends to client)
  create: protectedProcedure
    .input(
      z.object({
        serviceIds: z.array(z.number()),
        clientId: z.string(),
        conversationId: z.string(),
        title: z.string(),
        price: z.number(),
        eventDate: z.date(),
        includes: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch service details for the provided serviceIds
      const services = await ctx.db.service.findMany({
        where: {
          id: {
            in: input.serviceIds,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (services.length !== input.serviceIds.length) {
        throw new Error("One or more services not found");
      }

      return ctx.db.quote.create({
        data: {
          vendorId: ctx.user.id,
          clientId: input.clientId,
          conversationId: input.conversationId,
          title: input.title,
          price: input.price,
          eventDate: input.eventDate,
          includes: input.includes,
          services: services as Prisma.JsonArray, // Store service details as JSON
        },
        include: {
          client: {
            select: {
              username: true,
              email: true,
              clientProfile: true,
            },
          },
        },
      });
    }),

  // Update quote status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "PENDING",
          "ACCEPTED",
          "REJECTED",
          "REVISION_REQUESTED",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.db.quote.findUnique({
        where: { id: input.id },
      });

      if (!quote) {
        throw new Error("Quote not found");
      }

      // Verify authorization (vendor or client can update status)
      if (quote.vendorId !== ctx.user.id && quote.clientId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return ctx.db.quote.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  // Get all quotes for vendor
  getMyQuotesAsVendor: protectedProcedure
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
      return ctx.db.quote.findMany({
        where: {
          vendorId: ctx.user.id,
          ...(input?.status ? { status: input.status } : {}),
        },
        include: {
          client: {
            select: {
              username: true,
              email: true,
              clientProfile: true,
            },
          },
          conversation: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  // Get all quotes for client
  getMyQuotesAsClient: protectedProcedure
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
      return ctx.db.quote.findMany({
        where: {
          clientId: ctx.user.id,
          ...(input?.status ? { status: input.status } : {}),
        },
        include: {
          vendor: {
            select: {
              username: true,
              email: true,
              vendorProfile: true,
            },
          },
          conversation: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  // Get a single quote by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const quote = await ctx.db.quote.findUnique({
        where: { id: input.id },
        include: {
          vendor: {
            select: {
              username: true,
              email: true,
              vendorProfile: true,
            },
          },
          client: {
            select: {
              username: true,
              email: true,
              clientProfile: true,
            },
          },
          conversation: true,
        },
      });

      if (!quote) {
        throw new Error("Quote not found");
      }

      // Verify authorization
      if (quote.vendorId !== ctx.user.id && quote.clientId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return quote;
    }),

  // Get quote count by status for vendor dashboard
  getVendorQuoteStats: protectedProcedure.query(async ({ ctx }) => {
    const [pending, accepted, rejected, revisionRequested] = await Promise.all([
      ctx.db.quote.count({
        where: { vendorId: ctx.user.id, status: "PENDING" },
      }),
      ctx.db.quote.count({
        where: { vendorId: ctx.user.id, status: "ACCEPTED" },
      }),
      ctx.db.quote.count({
        where: { vendorId: ctx.user.id, status: "REJECTED" },
      }),
      ctx.db.quote.count({
        where: { vendorId: ctx.user.id, status: "REVISION_REQUESTED" },
      }),
    ]);

    return {
      pending,
      accepted,
      rejected,
      revisionRequested,
      total: pending + accepted + rejected + revisionRequested,
    };
  }),
});
