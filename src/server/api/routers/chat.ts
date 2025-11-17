import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const chatRouter = createTRPCRouter({
  // Get all conversations for current user
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.conversation.findMany({
      where: { participants: { some: { id: ctx.user.id } } },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            email: true,
            clientProfile: {
              select: {
                name: true,
                avatarUrl: true,
                location: true,
              },
            },
            vendorProfile: {
              select: {
                companyName: true,
                avatarUrl: true,
                level: true,
                rating: true,
                avgResponseTime: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            text: true,
            createdAt: true,
            senderId: true,
          },
        },
        quotes: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }),

  // Get messages for a specific conversation
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(), // For pagination
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user is part of conversation
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
        include: { participants: { select: { id: true } } },
      });

      if (!conversation || !conversation.participants.some((p) => p.id === ctx.user.id)) {
        throw new Error("Unauthorized");
      }

      const messages = await ctx.db.message.findMany({
        where: { conversationId: input.conversationId },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              clientProfile: { select: { name: true, avatarUrl: true } },
              vendorProfile: { select: { companyName: true, avatarUrl: true } },
            },
          },
          quote: true,
        },
      });

      let nextCursor: string | undefined = undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem!.id;
      }

      return {
        messages: messages.reverse(), // Return in chronological order
        nextCursor,
      };
    }),

  // Send a text message
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        text: z.string().min(1),
        optimisticId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is part of conversation
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
        include: { participants: { select: { id: true } } },
      });

      if (!conversation || !conversation.participants.some((p) => p.id === ctx.user.id)) {
        throw new Error("Unauthorized");
      }

      // Create message and update conversation
      const [message] = await ctx.db.$transaction([
        ctx.db.message.create({
          data: {
            conversationId: input.conversationId,
            senderId: ctx.user.id,
            text: input.text,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                clientProfile: { select: { name: true, avatarUrl: true } },
                vendorProfile: { select: { companyName: true, avatarUrl: true } },
              },
            },
          },
        }),
        ctx.db.conversation.update({
          where: { id: input.conversationId },
          data: { updatedAt: new Date() },
        }),
      ]);

      return message;
    }),

  // Get or create a conversation between two users
  getOrCreateConversation: protectedProcedure
    .input(
      z.object({
        otherUserId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if conversation already exists
      const existingConversation = await ctx.db.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { id: ctx.user.id } } },
            { participants: { some: { id: input.otherUserId } } },
            { participants: { every: { id: { in: [ctx.user.id, input.otherUserId] } } } },
          ],
        },
        include: {
          participants: {
            select: {
              id: true,
              username: true,
              clientProfile: { select: { name: true, avatarUrl: true } },
              vendorProfile: { select: { companyName: true, avatarUrl: true } },
            },
          },
        },
      });

      if (existingConversation) {
        return existingConversation;
      }

      // Create new conversation
      return ctx.db.conversation.create({
        data: {
          participants: {
            connect: [{ id: ctx.user.id }, { id: input.otherUserId }],
          },
        },
        include: {
          participants: {
            select: {
              id: true,
              username: true,
              clientProfile: { select: { name: true, avatarUrl: true } },
              vendorProfile: { select: { companyName: true, avatarUrl: true } },
            },
          },
        },
      });
    }),

  // Create a conversation with an initial message (for quote requests from service/vendor page)
  createConversationWithMessage: protectedProcedure
    .input(
      z.object({
        otherUserId: z.string(),
        initialMessage: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if conversation already exists
      const existingConversation = await ctx.db.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { id: ctx.user.id } } },
            { participants: { some: { id: input.otherUserId } } },
          ],
        },
      });

      if (existingConversation) {
        // Just send the message
        const message = await ctx.db.message.create({
          data: {
            conversationId: existingConversation.id,
            senderId: ctx.user.id,
            text: input.initialMessage,
          },
        });

        return { conversationId: existingConversation.id, message };
      }

      // Create conversation with initial message
      const conversation = await ctx.db.conversation.create({
        data: {
          participants: {
            connect: [{ id: ctx.user.id }, { id: input.otherUserId }],
          },
          messages: {
            create: {
              senderId: ctx.user.id,
              text: input.initialMessage,
            },
          },
        },
        include: {
          messages: true,
        },
      });

      return { conversationId: conversation.id, message: conversation.messages[0] };
    }),
});
