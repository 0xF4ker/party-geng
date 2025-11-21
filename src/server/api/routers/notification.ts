import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await ctx.db.notification.findMany({
      where: {
        userId: ctx.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return notifications;
  }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.notification.count({
      where: {
        userId: ctx.user.id,
        read: false,
      },
    });
    return count;
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.updateMany({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        data: {
          read: true,
        },
      });
      return true;
    }),

  markManyAsRead: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.updateMany({
        where: {
          id: {
            in: input.ids,
          },
          userId: ctx.user.id,
        },
        data: {
          read: true,
        },
      });
      return true;
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({
      where: {
        userId: ctx.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });
    return true;
  }),
  
  markConversationAsRead: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.notification.updateMany({
        where: {
          userId: ctx.user.id,
          conversationId: input.conversationId,
          read: false,
        },
        data: {
          read: true,
        },
      });
      return true;
    }),
});
