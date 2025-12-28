import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure, // Import adminProcedure
} from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { appRouter } from "@/server/api/root";
import {
  BoardPostType,
  GuestStatus,
  Prisma,
  QuoteStatus,
} from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { logActivity } from "../services/activityLogger"; // Import logger

const locationSchema = z
  .object({
    place_id: z.number(),
    licence: z.string(),
    osm_type: z.string(),
    osm_id: z.number(),
    boundingbox: z.array(z.string()),
    lat: z.string(),
    lon: z.string(),
    display_name: z.string(),
    class: z.string(),
    type: z.string(),
    importance: z.number(),
    icon: z.string().optional(),
  })
  .nullable()
  .optional();

export const eventRouter = createTRPCRouter({
  // --- ADMIN ACTIONS ---

  // 1. Get All Events (Admin Dashboard)
  adminGetEvents: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search } = input;

      const where: Prisma.ClientEventWhereInput = search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              {
                client: {
                  name: { contains: search, mode: "insensitive" },
                },
              },
              {
                client: {
                  user: { username: { contains: search, mode: "insensitive" } },
                },
              },
            ],
          }
        : {};

      const items = await ctx.db.clientEvent.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { date: "desc" }, // Most recent events first
        include: {
          client: {
            include: {
              user: {
                select: { email: true, username: true },
              },
            },
          },
          _count: {
            select: { hiredVendors: true, guestLists: true },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return { items, nextCursor };
    }),

  // 2. Takedown Event (Admin Action)
  adminDeleteEvent: adminProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      ctx.auditFlags.disabled = true; // Disable auto-logging to handle manually

      const event = await ctx.db.clientEvent.findUnique({
        where: { id: input.id },
        include: { client: true },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Delete the event
      await ctx.db.clientEvent.delete({
        where: { id: input.id },
      });

      // Log the administrative action
      await logActivity({
        ctx,
        action: "EVENT_TAKEDOWN",
        entityType: "EVENT",
        entityId: input.id,
        details: {
          title: event.title,
          ownerId: event.client.userId,
          reason: input.reason ?? "Violates community guidelines",
        },
      });

      return { success: true };
    }),

  // --- USER ACTIONS ---

  // Get all events for the current user
  getMyEvents: protectedProcedure.query(async ({ ctx }) => {
    const clientProfile = await ctx.db.clientProfile.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!clientProfile) {
      return { upcoming: [], past: [] };
    }

    const events = await ctx.db.clientEvent.findMany({
      where: { clientProfileId: clientProfile.id },
      include: {
        hiredVendors: {
          include: {
            vendor: {
              include: {
                vendorProfile: true,
                clientProfile: true,
              },
            },
          },
        },
        wishlist: {
          include: {
            items: {
              include: {
                contributions: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const now = new Date();
    const upcoming = events.filter((e) => e.date >= now);
    const past = events.filter((e) => e.date < now);

    return { upcoming, past };
  }),

  // Get event by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("--- [event.getById] Starting ---");
      let event = await ctx.db.clientEvent.findUnique({
        where: { id: input.id },
        include: {
          client: true,
          hiredVendors: {
            include: {
              vendor: {
                include: {
                  vendorProfile: true,
                  clientProfile: true,
                },
              },
            },
          },
          wishlist: {
            include: {
              items: {
                include: {
                  contributions: true,
                },
              },
            },
          },
          budget: {
            include: {
              items: true,
            },
          },
          guestLists: {
            include: {
              guests: true,
            },
          },
          conversation: {
            include: {
              participants: true,
            },
          },
          boardPosts: {
            include: {
              author: true,
            },
          },
        },
      });

      if (!event) {
        console.log("--- [event.getById] Event not found ---");
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }
      console.log(`--- [event.getById] Found event: ${event.title}`);

      const isOwner = event.client.userId === ctx.user.id;
      const isParticipant =
        event.conversation?.participants.some(
          (p) => p.userId === ctx.user.id,
        ) ?? false;
      console.log(`--- [event.getById] Is owner? ${isOwner}`);
      console.log(
        `--- [event.getById] Conversation exists? ${!!event.conversation}`,
      );
      console.log(
        `--- [event.getById] Is owner a participant? ${isParticipant}`,
      );

      if (isOwner && (!event.conversation || !isParticipant)) {
        console.log(
          "--- [event.getById] No conversation found or owner is not a participant. Fixing...",
        );
        const caller = appRouter.createCaller(ctx);
        const hiredVendorIds = event.hiredVendors.map((v) => v.vendorId);
        console.log(
          `--- [event.getById] Hired vendor IDs: ${JSON.stringify(hiredVendorIds)}`,
        );

        await caller.chat.createEventGroupChat({
          eventId: event.id,
          memberIds: hiredVendorIds,
        });
        console.log(
          "--- [event.getById] createEventGroupChat called. Refetching event... ---",
        );

        event = await ctx.db.clientEvent.findUnique({
          where: { id: input.id },
          include: {
            client: true,
            hiredVendors: {
              include: {
                vendor: {
                  include: { vendorProfile: true, clientProfile: true },
                },
              },
            },
            wishlist: {
              include: { items: { include: { contributions: true } } },
            },
            budget: { include: { items: true } },
            guestLists: { include: { guests: true } },
            conversation: { include: { participants: true } },
            boardPosts: { include: { author: true } },
          },
        });

        if (!event) {
          console.log(
            "--- [event.getById] CRITICAL: Failed to refetch event after creating conversation. ---",
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to refetch event after creating conversation.",
          });
        }
        console.log("--- [event.getById] Event refetched successfully. ---");
      }

      const isParticipantAfterFix =
        event.conversation?.participants.some(
          (p) => p.userId === ctx.user.id,
        ) ?? false;
      console.log(
        `--- [event.getById] Is participant after fix? ${isParticipantAfterFix}`,
      );

      let hasInvitation = false;
      if (!isOwner && !isParticipantAfterFix && !event.isPublic) {
        const invitation = await ctx.db.eventInvitation.findFirst({
          where: {
            eventId: input.id,
            vendorId: ctx.user.id,
          },
        });
        if (invitation) {
          hasInvitation = true;
          console.log(
            "--- [event.getById] User has an invitation. Access granted. ---",
          );
        }
      }

      if (
        !isOwner &&
        !isParticipantAfterFix &&
        !event.isPublic &&
        !hasInvitation
      ) {
        console.log("--- [event.getById] Authorization failed. ---");
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this event",
        });
      }

      console.log("--- [event.getById] Returning event successfully. ---");
      return event;
    }),

  // Create event
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        date: z.date(),
        location: locationSchema,
        coverImage: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const clientProfile = await ctx.db.clientProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!clientProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }
      const locationData = input.location
        ? (input.location as Prisma.JsonObject)
        : Prisma.JsonNull;

      return ctx.db.clientEvent.create({
        data: {
          title: input.title,
          date: input.date,
          location: locationData,
          coverImage: input.coverImage,
          clientProfileId: clientProfile.id,
          budget: {
            create: {},
          },
          guestLists: {
            create: {
              title: "Default Guest List",
            },
          },
          conversation: {
            create: {
              isGroup: true,
              groupAdminId: ctx.user.id,
              participants: {
                create: {
                  userId: ctx.user.id,
                },
              },
            },
          },
        },
      });
    }),

  // Update event
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        date: z.date().optional(),
        location: locationSchema,
        coverImage: z.string().optional(),
        isPublic: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.clientEvent.findUnique({
        where: { id: input.id },
        include: {
          client: true,
          conversation: { include: { participants: true } },
        },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const isOwner = event.client.userId === ctx.user.id;
      const isParticipant =
        event.conversation?.participants.some(
          (p) => p.userId === ctx.user.id,
        ) ?? false;

      if (!isOwner && !isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this event",
        });
      }
      const locationData = input.location
        ? (input.location as Prisma.JsonObject)
        : Prisma.JsonNull;

      return ctx.db.clientEvent.update({
        where: { id: input.id },
        data: {
          title: input.title,
          date: input.date,
          location: locationData,
          coverImage: input.coverImage,
          isPublic: input.isPublic,
        },
      });
    }),

  // Delete event
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.clientEvent.findUnique({
        where: { id: input.id },
        include: { client: true },
      });

      if (!event || event.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this event",
        });
      }

      await ctx.db.clientEvent.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Add vendor to event
  addVendor: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        vendorId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.clientEvent.findUnique({
        where: { id: input.eventId },
        include: { client: true },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      const isOwner = event.client.userId === ctx.user.id;

      if (!isOwner) {
        const isVendorAccepting = ctx.user.id === input.vendorId;
        if (!isVendorAccepting) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You cannot add another vendor to this event.",
          });
        }

        const acceptedInvitation = await ctx.db.eventInvitation.findFirst({
          where: {
            eventId: input.eventId,
            vendorId: input.vendorId,
            status: QuoteStatus.ACCEPTED,
          },
        });

        if (!acceptedInvitation) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have a valid invitation to join this event.",
          });
        }
      }

      const eventVendor = await ctx.db.eventVendor.create({
        data: {
          eventId: input.eventId,
          vendorId: input.vendorId,
        },
      });

      const caller = appRouter.createCaller(ctx);
      await caller.chat.createEventGroupChat({
        eventId: input.eventId,
        memberIds: [input.vendorId],
      });

      return eventVendor;
    }),

  // Remove vendor from event
  removeVendor: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        vendorId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.clientEvent.findUnique({
        where: { id: input.eventId },
        include: { client: true },
      });

      if (!event || event.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this event",
        });
      }

      const eventVendor = await ctx.db.eventVendor.findFirst({
        where: {
          eventId: input.eventId,
          vendorId: input.vendorId,
        },
      });

      if (!eventVendor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vendor not found in event",
        });
      }

      await ctx.db.eventVendor.delete({
        where: { id: eventVendor.id },
      });

      return { success: true };
    }),

  updateBudgetItem: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        description: z.string().optional(),
        estimatedCost: z.number().optional(),
        actualCost: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { itemId, ...data } = input;
      const item = await ctx.db.eventBudgetItem.findUnique({
        where: { id: itemId },
        include: {
          budget: { include: { event: { include: { client: true } } } },
        },
      });
      if (!item || item.budget.event.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this event",
        });
      }
      return ctx.db.eventBudgetItem.update({
        where: { id: itemId },
        data,
      });
    }),

  addBudgetItem: protectedProcedure
    .input(
      z.object({
        budgetId: z.string(),
        description: z.string(),
        estimatedCost: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const budget = await ctx.db.eventBudget.findUnique({
        where: { id: input.budgetId },
        include: { event: { include: { client: true } } },
      });
      if (!budget || budget.event.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to add to this budget",
        });
      }
      return ctx.db.eventBudgetItem.create({
        data: {
          budgetId: input.budgetId,
          description: input.description,
          estimatedCost: input.estimatedCost,
        },
      });
    }),

  deleteBudgetItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.eventBudgetItem.findUnique({
        where: { id: input.itemId },
        include: {
          budget: { include: { event: { include: { client: true } } } },
        },
      });
      if (!item || item.budget.event.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this item",
        });
      }
      await ctx.db.eventBudgetItem.delete({ where: { id: input.itemId } });
      return { success: true };
    }),

  addGuest: protectedProcedure
    .input(
      z.object({
        guestListId: z.string(),
        name: z.string(),
        email: z.string().email().optional(),
        tableNumber: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const guestList = await ctx.db.eventGuestList.findUnique({
        where: { id: input.guestListId },
        include: { event: { include: { client: true } } },
      });
      if (!guestList || guestList.event.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this event",
        });
      }
      return ctx.db.eventGuest.create({
        data: {
          name: input.name,
          email: input.email,
          tableNumber: input.tableNumber,
          listId: input.guestListId,
          status: "PENDING",
        },
      });
    }),

  updateGuest: protectedProcedure
    .input(
      z.object({
        guestId: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        status: z.nativeEnum(GuestStatus).optional(),
        tableNumber: z.number().int().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { guestId, ...data } = input;
      const guest = await ctx.db.eventGuest.findUnique({
        where: { id: guestId },
        include: {
          list: { include: { event: { include: { client: true } } } },
        },
      });
      if (!guest || guest.list.event.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this event",
        });
      }
      return ctx.db.eventGuest.update({ where: { id: guestId }, data });
    }),

  deleteGuest: protectedProcedure
    .input(z.object({ guestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const guest = await ctx.db.eventGuest.findUnique({
        where: { id: input.guestId },
        include: {
          list: { include: { event: { include: { client: true } } } },
        },
      });
      if (!guest || guest.list.event.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this event",
        });
      }
      await ctx.db.eventGuest.delete({ where: { id: input.guestId } });
      return { success: true };
    }),

  sendGuestInvitation: protectedProcedure
    .input(z.object({ guestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const guest = await ctx.db.eventGuest.findUnique({
        where: { id: input.guestId },
        include: {
          list: { include: { event: { include: { client: true } } } },
        },
      });

      if (!guest || guest.list.event.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission.",
        });
      }

      const invitationToken = createId();
      await ctx.db.eventGuest.update({
        where: { id: input.guestId },
        data: { invitationToken },
      });

      const invitationLink = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/invitation/${invitationToken}`;

      console.log(`Sending invitation to ${guest.email}: ${invitationLink}`);
      // TODO: Email sending logic

      return { success: true };
    }),

  addEmptyGuestList: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.clientEvent.findUnique({
        where: { id: input.eventId },
        include: { client: true },
      });
      if (!event || event.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this event",
        });
      }
      return ctx.db.eventGuestList.create({ data: input });
    }),

  getBoardPosts: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.boardPost.findMany({
        where: { eventId: input.eventId },
        orderBy: { createdAt: "desc" },
        include: { author: true },
      });
    }),

  addBoardPost: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        type: z.nativeEnum(BoardPostType),
        content: z.string(),
        colorIndex: z.number(),
        x: z.number(),
        y: z.number(),
        zIndex: z.number(),
        rotation: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { eventId, ...data } = input;
      return ctx.db.boardPost.create({
        data: {
          ...data,
          event: { connect: { id: eventId } },
          author: { connect: { id: ctx.user.id } },
          authorName: ctx.user.username,
        },
      });
    }),

  updateBoardPostPosition: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        x: z.number(),
        y: z.number(),
        zIndex: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.boardPost.update({ where: { id }, data });
    }),

  updateBoardPost: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().optional(),
        colorIndex: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      // TODO: check for author
      return ctx.db.boardPost.update({ where: { id }, data });
    }),

  deleteBoardPost: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: check for author
      return ctx.db.boardPost.delete({ where: { id: input.id } });
    }),
});
