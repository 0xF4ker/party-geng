import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { NotificationType } from "@prisma/client";
export const quoteRouter = createTRPCRouter({
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
      const {
        serviceIds,
        clientId,
        conversationId,
        title,
        price,
        eventDate,
        includes,
      } = input;
      const vendorId = ctx.user.id;
      const conversation = await ctx.db.conversation.findFirst({
        where: {
          id: conversationId,
          participants: { some: { userId: vendorId } },
        },
      });
      if (!conversation) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not part of this conversation.",
        });
      }
      const services = await ctx.db.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, name: true },
      });
      if (services.length !== serviceIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more services not found.",
        });
      }
      const result = await ctx.db.$transaction(async (prisma) => {
        const quote = await prisma.quote.create({
          data: {
            vendorId,
            clientId,
            conversationId,
            title,
            price,
            eventDate,
            includes,
            services: services as Prisma.JsonArray,
          },
        });
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: vendorId,
            text: `Quote: ${title} - ₦${price.toLocaleString()}`,
          },
        });
        
        const updatedQuote = await prisma.quote.update({
            where: { id: quote.id },
            data: { messageId: message.id },
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
        await prisma.notification.create({
            data: {
                userId: clientId,
                type: NotificationType.QUOTE_RECEIVED,
                message: `You have received a new quote from ${ctx.user.username}`,
                link: `/inbox?conversation=${conversationId}`,
            },
        });
        return { quote: updatedQuote, message };
      });
      return result.quote;
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.db.quote.findUnique({
        where: { id: input.id },
      });
      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found." });
      }
      if (quote.vendorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to delete this quote.",
        });
      }
      return ctx.db.quote.delete({
        where: { id: input.id },
      });
    }),
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
      if (quote.vendorId !== ctx.user.id && quote.clientId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      const updatedQuote = await ctx.db.quote.update({
        where: { id: input.id },
        data: { status: input.status },
      });
      const isClientAction = quote.clientId === ctx.user.id;
      const notificationRecipientId = isClientAction ? quote.vendorId : quote.clientId;
      const message = isClientAction
          ? `Your quote has been ${input.status.toLowerCase()} by the client.`
          : `The vendor has updated the quote status to ${input.status.toLowerCase()}.`;
      await ctx.db.notification.create({
          data: {
              userId: notificationRecipientId,
              type: NotificationType.ORDER_UPDATE,
              message: message,
              link: `/inbox?conversation=${quote.conversationId}`,
          },
      });
      return updatedQuote;
    }),
  accept: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.db.quote.findUnique({
        where: { id: input.id },
      });
      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found." });
      }
      if (quote.clientId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the client can accept this quote.",
        });
      }
      if (quote.status !== "PENDING") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Quote is not pending and cannot be accepted.",
        });
      }
      return ctx.db.$transaction(async (prisma) => {
        const updatedQuote = await prisma.quote.update({
          where: { id: input.id },
          data: { status: "ACCEPTED" },
        });
        const order = await prisma.order.create({
          data: {
            quoteId: quote.id,
            clientId: quote.clientId,
            vendorId: quote.vendorId,
            amount: quote.price,
            status: "ACTIVE",
            eventDate: quote.eventDate,
          },
        });
        await prisma.notification.create({
          data: {
            userId: quote.vendorId,
            type: NotificationType.ORDER_UPDATE,
            message: `Your quote "${quote.title}" has been accepted! Order #${order.id.substring(0, 8)} created.`,
            link: `/orders/${order.id}`,
          },
        });
        if (quote.messageId) {
        }
        return { success: true, order, quote: updatedQuote };
      });
    }),
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
      if (quote.vendorId !== ctx.user.id && quote.clientId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      return quote;
    }),
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
