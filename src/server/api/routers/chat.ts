import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const chatRouter = createTRPCRouter({
  getConversations: protectedProcedure.query(({ ctx }) => {
    return ctx.db.conversation.findMany({
      where: { participants: { some: { id: ctx.user.id } } },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
  }),
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        text: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          text: input.text,
        },
      });
    }),
});
