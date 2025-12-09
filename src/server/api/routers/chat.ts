import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { QuoteStatus } from "@prisma/client";

export const chatRouter = createTRPCRouter({
  // Get all conversations for current user
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const conversations = await ctx.db.conversation.findMany({
      where: { participants: { some: { userId: ctx.user.id } } },
      include: {
        clientEvent: {
          select: {
            id: true,
            title: true,
          },
        },
        participants: {
          include: {
            user: {
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
                    location: true,
                  },
                },
                createdAt: true,
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
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const unreadCounts = await Promise.all(
      conversations.map(async (c) => {
        const participant = c.participants.find(p => p.userId === ctx.user.id);
        if (!participant) return { conversationId: c.id, count: 0 };
        
        const count = await ctx.db.message.count({
          where: {
            conversationId: c.id,
            createdAt: {
              gt: participant.lastReadAt ?? new Date(0),
            },
            senderId: {
              not: ctx.user.id,
            }
          },
        });
        return { conversationId: c.id, count };
      })
    );

    const unreadMap = unreadCounts.reduce(
      (acc, curr) => {
        acc[curr.conversationId] = curr.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return conversations.map((c) => ({
      ...c,
      unreadCount: unreadMap[c.id] ?? 0,
    }));
  }),

  // Get messages for a specific conversation
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(), // For pagination
      }),
    )
    .query(async ({ ctx, input }) => {
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
        include: { participants: true },
      });

      if (
        !conversation ||
        !conversation.participants.some((p) => p.userId === ctx.user.id)
      ) {
        throw new Error("Unauthorized");
      }

      const participant = conversation.participants.find(p => p.userId === ctx.user.id);

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
          eventInvitation: true,
        },
      });

      let nextCursor: string | undefined = undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem!.id;
      }
      
      const firstUnread = messages.find(m => m.createdAt > (participant?.lastReadAt ?? new Date(0)) && m.senderId !== ctx.user.id);

      return {
        messages: messages.reverse(),
        nextCursor,
        firstUnreadTimestamp: firstUnread?.createdAt ?? null,
      };
    }),

  // Send a text message
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        text: z.string().min(1),
        optimisticId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
        include: { participants: { include: { user: true } } },
      });

      if (
        !conversation ||
        !conversation.participants.some((p) => p.userId === ctx.user.id)
      ) {
        throw new Error("Unauthorized");
      }

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
                vendorProfile: {
                  select: { companyName: true, avatarUrl: true },
                },
              },
            },
            quote: true,
            eventInvitation: true,
          },
        }),
        ctx.db.conversation.update({
          where: { id: input.conversationId },
          data: { updatedAt: new Date() },
        }),
      ]);

      return message;
    }),
    
  markConversationAsRead: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.conversationParticipant.update({
        where: {
          userId_conversationId: {
            userId: ctx.user.id,
            conversationId: input.conversationId,
          },
        },
        data: {
          lastReadAt: new Date(),
        },
      });
    }),

  // Get or create a conversation between two users
  getOrCreateConversation: protectedProcedure
    .input(
      z.object({
        otherUserId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const users = [ctx.user.id, input.otherUserId];
      
      const existing = await ctx.db.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: ctx.user.id } } },
            { participants: { some: { userId: input.otherUserId } } },
            { participants: { every: { userId: { in: users } } } },
          ]
        },
      });

      if (existing) return existing;

      return ctx.db.conversation.create({
        data: {
          participants: {
            create: users.map(userId => ({
              user: { connect: { id: userId } }
            }))
          }
        },
      });
    }),
    
  getUnreadConversationCount: protectedProcedure.query(async ({ ctx }) => {
    const participations = await ctx.db.conversationParticipant.findMany({
      where: { userId: ctx.user.id },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    });

    let unreadCount = 0;
    for (const p of participations) {
      if (p.conversation.messages[0] && p.conversation.messages[0].createdAt > (p.lastReadAt ?? new Date(0)) && p.conversation.messages[0].senderId !== ctx.user.id) {
        unreadCount++;
      }
    }
    return unreadCount;
  }),

  createEventGroupChat: protectedProcedure
  .input(
    z.object({
      eventId: z.string(),
      memberIds: z.array(z.string()),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { eventId, memberIds } = input;
    const userId = ctx.user.id;

    // 1. Find the event
    const event = await ctx.db.clientEvent.findUnique({
      where: { id: eventId },
      include: { client: true },
    });

    if (!event) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
    }
    
    // 2. Authorize action
    const isOwner = event.client.userId === userId;
    if (!isOwner) {
        const invitations = await ctx.db.eventInvitation.findMany({
            where: {
                eventId: input.eventId,
                vendorId: { in: input.memberIds },
                status: QuoteStatus.ACCEPTED,
            }
        });

        if (invitations.length !== input.memberIds.length) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "You don't have permission to create a chat for this event.",
            });
        }
    }

    // 3. Check if a group chat already exists for this event
    let conversation = await ctx.db.conversation.findUnique({
      where: { clientEventId: eventId },
      include: { participants: true }
    });

    if (conversation) {
      // 4a. If it exists, add new members
      const existingParticipantIds = new Set(conversation.participants.map((p) => p.userId));
      const allPotentialMembers = [...new Set([event.client.userId, ...memberIds])];
      const newMemberIds = allPotentialMembers.filter((id) => !existingParticipantIds.has(id));

      if (newMemberIds.length > 0) {
        await ctx.db.conversation.update({
          where: { id: conversation.id },
          data: {
            participants: {
              create: newMemberIds.map((id) => ({ userId: id })),
            },
          },
        });
      }
    } else {
      // 4b. If it doesn't exist, create it
      const allParticipantIds = [...new Set([event.client.userId, ...memberIds])];
      conversation = await ctx.db.conversation.create({
        data: {
          clientEventId: eventId,
          isGroup: true,
          groupAdminId: event.client.userId,
          participants: {
            create: allParticipantIds.map((id) => ({ userId: id })),
          },
        },
        include: {
          participants: true,
        },
      });
    }

    return conversation;
  }),
});
