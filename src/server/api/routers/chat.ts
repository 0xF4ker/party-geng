import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { QuoteStatus } from "@prisma/client";

export const chatRouter = createTRPCRouter({
  // Get all conversations for current user
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    // Fetch blocked user IDs to filter them out or handle them
    const blockedUsers = await ctx.db.block.findMany({
      where: {
        OR: [{ blockerId: ctx.user.id }, { blockedId: ctx.user.id }],
      },
      select: {
        blockerId: true,
        blockedId: true,
      },
    });

    const blockedUserIds = new Set(
      blockedUsers.flatMap((b) => [b.blockerId, b.blockedId]).filter((id) => id !== ctx.user.id)
    );

    const conversations = await ctx.db.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: ctx.user.id,
          },
        },
      },
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
          where: {
            // Ensure the preview message isn't one deleted by the user
            deletions: {
              none: {
                userId: ctx.user.id,
              },
            },
          },
          select: {
            id: true,
            text: true,
            createdAt: true,
            senderId: true,
            isDeletedForEveryone: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Post-processing to filter and format
    const processedConversations = await Promise.all(
      conversations.map(async (c) => {
        const myParticipant = c.participants.find((p) => p.userId === ctx.user.id);
        if (!myParticipant) return null;

        // Check if conversation should be hidden due to "delete conversation" action
        // If the latest message is older than clearedAt, hide the conversation
        const latestMessage = c.messages[0];
        if (
          myParticipant.clearedAt &&
          latestMessage &&
          latestMessage.createdAt <= myParticipant.clearedAt
        ) {
          // Effectively hidden until new message
          return null;
        }

        // Calculate unread count
        const unreadCount = await ctx.db.message.count({
          where: {
            conversationId: c.id,
            createdAt: {
              gt: myParticipant.lastReadAt ?? new Date(0),
            },
            senderId: {
              not: ctx.user.id,
            },
            // Don't count messages deleted for everyone or for me
            isDeletedForEveryone: false,
            deletions: {
              none: {
                userId: ctx.user.id,
              },
            },
          },
        });

        // Add blocked status to other participants
        const participants = c.participants.map((p) => ({
          ...p,
          isBlocked: blockedUserIds.has(p.userId),
        }));

        return {
          ...c,
          participants,
          unreadCount,
          // Add my settings to the top level for easier access
          isPinned: myParticipant.isPinned,
          isArchived: myParticipant.isArchived,
          isMuted: myParticipant.isMuted,
        };
      })
    );

    return processedConversations.filter((c): c is NonNullable<typeof c> => c !== null);
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

      const participant = conversation.participants.find(
        (p) => p.userId === ctx.user.id,
      );

      const messages = await ctx.db.message.findMany({
        where: {
          conversationId: input.conversationId,
          // Filter out messages deleted for me
          deletions: {
            none: {
              userId: ctx.user.id,
            },
          },
          // Filter out messages cleared by "delete conversation"
          ...(participant?.clearedAt
            ? {
                createdAt: {
                  gt: participant.clearedAt,
                },
              }
            : {}),
        },
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

      const firstUnread = messages.find(
        (m) =>
          m.createdAt > (participant?.lastReadAt ?? new Date(0)) &&
          m.senderId !== ctx.user.id,
      );

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

      // Check for blocked users
      // If 1-on-1, check if the other user has blocked me or I blocked them
      if (!conversation.isGroup) {
        const otherParticipant = conversation.participants.find(
          (p) => p.userId !== ctx.user.id,
        );
        if (otherParticipant) {
          const block = await ctx.db.block.findFirst({
            where: {
              OR: [
                { blockerId: ctx.user.id, blockedId: otherParticipant.userId },
                { blockerId: otherParticipant.userId, blockedId: ctx.user.id },
              ],
            },
          });

          if (block) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You cannot message this user.",
            });
          }
        }
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
      // Check block status first
      const block = await ctx.db.block.findFirst({
        where: {
          OR: [
            { blockerId: ctx.user.id, blockedId: input.otherUserId },
            { blockerId: input.otherUserId, blockedId: ctx.user.id },
          ],
        },
      });

      if (block) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot create conversation with this user.",
        });
      }

      const users = [ctx.user.id, input.otherUserId];

      const existing = await ctx.db.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: ctx.user.id } } },
            { participants: { some: { userId: input.otherUserId } } },
            { participants: { every: { userId: { in: users } } } },
          ],
        },
      });

      if (existing) {
        return existing;
      }

      return ctx.db.conversation.create({
        data: {
          participants: {
            create: users.map((userId) => ({
              user: { connect: { id: userId } },
            })),
          },
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
                createdAt: "desc",
              },
              take: 1,
              where: {
                deletions: {
                  none: {
                    userId: ctx.user.id,
                  },
                },
              },
            },
          },
        },
      },
    });

    let unreadCount = 0;
    for (const p of participations) {
      const latestMsg = p.conversation.messages[0];
      if (
        latestMsg &&
        latestMsg.createdAt > (p.lastReadAt ?? new Date(0)) &&
        latestMsg.senderId !== ctx.user.id &&
        !latestMsg.isDeletedForEveryone
      ) {
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
          },
        });

        if (invitations.length !== input.memberIds.length) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "You don't have permission to create a chat for this event.",
          });
        }
      }

      // 3. Check if a group chat already exists for this event
      let conversation = await ctx.db.conversation.findUnique({
        where: { clientEventId: eventId },
        include: { participants: true },
      });

      if (conversation) {
        // 4a. If it exists, add new members
        const existingParticipantIds = new Set(
          conversation.participants.map((p) => p.userId),
        );
        const allPotentialMembers = [
          ...new Set([event.client.userId, ...memberIds]),
        ];
        const newMemberIds = allPotentialMembers.filter(
          (id) => !existingParticipantIds.has(id),
        );

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
        const allParticipantIds = [
          ...new Set([event.client.userId, ...memberIds]),
        ];
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

  deleteMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        deleteType: z.enum(["ME", "EVERYONE"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db.message.findUnique({
        where: { id: input.messageId },
        include: { conversation: true },
      });

      if (!message) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
      }

      if (input.deleteType === "EVERYONE") {
        const isSender = message.senderId === ctx.user.id;
        const isGroupAdmin = message.conversation.groupAdminId === ctx.user.id;

        if (!isSender && !isGroupAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete your own messages for everyone, unless you are the group admin.",
          });
        }

        return ctx.db.message.update({
          where: { id: input.messageId },
          data: { isDeletedForEveryone: true },
        });
      } else {
        // Delete for ME: Create a MessageDeletion record
        return ctx.db.messageDeletion.create({
          data: {
            userId: ctx.user.id,
            messageId: input.messageId,
          },
        });
      }
    }),

  updateConversationSettings: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        isPinned: z.boolean().optional(),
        isArchived: z.boolean().optional(),
        isMuted: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.conversationParticipant.update({
        where: {
          userId_conversationId: {
            userId: ctx.user.id,
            conversationId: input.conversationId,
          },
        },
        data: {
          isPinned: input.isPinned,
          isArchived: input.isArchived,
          isMuted: input.isMuted,
        },
      });
    }),

  deleteConversation: protectedProcedure
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
          clearedAt: new Date(),
        },
      });
    }),

  removeParticipant: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        userIdToRemove: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
      });

      if (!conversation || !conversation.isGroup) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid conversation",
        });
      }

      if (conversation.groupAdminId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the group admin can remove members.",
        });
      }

      return ctx.db.conversationParticipant.delete({
        where: {
          userId_conversationId: {
            userId: input.userIdToRemove,
            conversationId: input.conversationId,
          },
        },
      });
    }),

  leaveGroup: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.db.conversation.findUnique({
        where: { id: input.conversationId },
      });

      if (!conversation || !conversation.isGroup) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid conversation",
        });
      }
      
      await ctx.db.conversationParticipant.delete({
        where: {
          userId_conversationId: {
            userId: ctx.user.id,
            conversationId: input.conversationId,
          },
        },
      });

      if (conversation.clientEventId) {
        const eventVendor = await ctx.db.eventVendor.findFirst({
            where: {
                eventId: conversation.clientEventId,
                vendorId: ctx.user.id
            }
        });

        if (eventVendor) {
            await ctx.db.eventVendor.delete({
                where: { id: eventVendor.id }
            });
        }
      }

      return { success: true };
    }),

  // --- SETTINGS ---
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    let settings = await ctx.db.chatSettings.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!settings) {
      settings = await ctx.db.chatSettings.create({
        data: { userId: ctx.user.id },
      });
    }

    return settings;
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        readReceipts: z.boolean().optional(),
        typingIndicators: z.boolean().optional(),
        muteAll: z.boolean().optional(),
        soundEnabled: z.boolean().optional(),
        vibrationEnabled: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
        theme: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chatSettings.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          ...input,
        },
        update: input,
      });
    }),
});