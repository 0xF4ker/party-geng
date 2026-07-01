import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  publicProcedure,
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
import { logActivity } from "../services/activityLogger";
import { emailService } from "@/server/services/emailService";
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
        orderBy: { startDate: "desc" },
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
  adminDeleteEvent: adminProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      ctx.auditFlags.disabled = true;
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
      await ctx.db.clientEvent.delete({
        where: { id: input.id },
      });
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
      orderBy: { startDate: "asc" },
    });
    const now = new Date();
    const upcoming = events.filter((e) => e.endDate >= now);
    const past = events
      .filter((e) => e.endDate < now)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    return { upcoming, past };
  }),
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      console.log("--- [event.getById] Starting ---");
      let event = await ctx.db.clientEvent.findUnique({
        where: { id: input.id },
        include: {
          client: true,
          coordinator: {
            include: {
              user: true,
            },
          },
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
          ticketTiers: true,
          guestLists: {
            include: {
              guests: {
                include: {
                  ticketTier: true,
                },
              },
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
      const isCoordinator = event.coordinator?.userId === ctx.user.id;
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
            coordinator: {
              include: {
                user: true,
              },
            },
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
            ticketTiers: true,
            guestLists: {
              include: {
                guests: {
                  include: {
                    ticketTier: true,
                  },
                },
              },
            },
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
      if (!isOwner && !isCoordinator && !isParticipantAfterFix && !event.isPublic) {
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
        !isCoordinator &&
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
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        location: locationSchema,
        coverImage: z.string().optional(),
        isTicketed: z.boolean().optional(),
        ticketPrice: z.number().optional(),
        questionnaireData: z.any().optional(),
        ticketTiers: z.array(z.object({
          name: z.string(),
          price: z.number(),
          description: z.string().optional(),
        })).optional(),
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
          startDate: input.startDate,
          endDate: input.endDate,
          location: locationData,
          coverImage: input.coverImage,
          clientProfileId: clientProfile.id,
          isTicketed: input.isTicketed ?? false,
          ticketPrice: input.ticketPrice ?? 0,
          ticketTiers: input.ticketTiers && input.ticketTiers.length > 0 ? {
            create: input.ticketTiers,
          } : undefined,
          questionnaireData: input.questionnaireData ?? undefined,
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
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        location: locationSchema,
        coverImage: z.string().optional(),
        isPublic: z.boolean().optional(),
        isTicketed: z.boolean().optional(),
        ticketPrice: z.number().optional(),
        questionnaireData: z.any().optional(),
        ticketTiers: z.array(z.object({
          id: z.string().optional(),
          name: z.string(),
          price: z.number(),
          description: z.string().optional(),
        })).optional(),
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
      
      const updatedEvent = await ctx.db.clientEvent.update({
        where: { id: input.id },
        data: {
          title: input.title,
          startDate: input.startDate,
          endDate: input.endDate,
          location: locationData,
          coverImage: input.coverImage,
          isPublic: input.isPublic,
          isTicketed: input.isTicketed,
          ticketPrice: input.ticketPrice,
          questionnaireData: input.questionnaireData ?? undefined,
        },
      });

      if (input.ticketTiers) {
        // Delete tiers that are no longer in the list
        const existingIds = input.ticketTiers.map(t => t.id).filter(Boolean) as string[];
        await ctx.db.ticketTier.deleteMany({
          where: {
            eventId: event.id,
            id: { notIn: existingIds }
          }
        });

        // Upsert tiers
        for (const tier of input.ticketTiers) {
          if (tier.id) {
            await ctx.db.ticketTier.update({
              where: { id: tier.id },
              data: {
                name: tier.name,
                price: tier.price,
                description: tier.description
              }
            });
          } else {
            await ctx.db.ticketTier.create({
              data: {
                eventId: event.id,
                name: tier.name,
                price: tier.price,
                description: tier.description
              }
            });
          }
        }
      }

      return updatedEvent;
    }),
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
        whatsAppNumber: z.string().optional(),
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
          whatsAppNumber: input.whatsAppNumber || null,
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
        whatsAppNumber: z.string().optional(),
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
          list: {
            include: {
              event: {
                include: {
                  client: true,
                  ticketTiers: true,
                },
              },
            },
          },
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

      // Formatted Date
      const eventDate = new Date(guest.list.event.startDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Formatted Location
      const locationObj = guest.list.event.location as any;
      const locationString = locationObj?.display_name || locationObj?.displayName || locationObj?.address || "To Be Announced";

      // Formatted Ticket Tiers
      let priceString = "Free Admission";
      if (guest.list.event.isTicketed) {
        if (guest.list.event.ticketTiers && guest.list.event.ticketTiers.length > 0) {
          priceString = guest.list.event.ticketTiers
            .map((t) => `${t.name}: ₦${t.price.toLocaleString()}`)
            .join(" | ");
        } else {
          priceString = `₦${guest.list.event.ticketPrice.toLocaleString()}`;
        }
      }

      // 1. Dispatch Email if available
      if (guest.email) {
        try {
          await emailService.send({
            to: guest.email,
            subject: `Exclusive Invite: ${guest.list.event.title}`,
            template: "GUEST_INVITATION",
            data: {
              name: guest.name,
              eventTitle: guest.list.event.title,
              link: invitationLink,
              hostName: guest.list.event.client.name || undefined,
              date: eventDate,
              location: locationString,
              price: priceString,
              tableNumber: guest.tableNumber !== null ? String(guest.tableNumber) : undefined,
            },
          });
        } catch (err) {
          console.error("Failed to send invitation email:", err);
        }
      }

      // 2. Dispatch WhatsApp message if available
      if (guest.whatsAppNumber) {
        const tableText = guest.tableNumber !== null ? `🪑 *Table Assignment:* Table ${guest.tableNumber}\n` : "";
        const messageBody = `You're Invited! 🥳\n\nHi *${guest.name}*,\n\nYou have been cordially invited to celebrate at the upcoming event:\n\n*${guest.list.event.title}*\n${guest.list.event.client.name ? `Hosted by: ${guest.list.event.client.name}\n` : ""}📅 *Date:* ${eventDate}\n📍 *Location:* ${locationString}\n🎟️ *Admission:* ${priceString}\n${tableText}\n👉 *RSVP & Confirm Attendance:* ${invitationLink}`;
        
        try {
          const { sendWhatsAppMessage } = await import("../../services/whatsapp");
          await sendWhatsAppMessage(guest.whatsAppNumber, messageBody);
        } catch (err) {
          console.error("Failed to send WhatsApp invitation:", err);
        }
      }

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
      return ctx.db.boardPost.update({ where: { id }, data });
    }),
  deleteBoardPost: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.boardPost.delete({ where: { id: input.id } });
    }),

  getUpcomingEvents: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    let events = await ctx.db.clientEvent.findMany({
      where: {
        isPublic: true,
        endDate: {
          gte: now,
        },
      },
      orderBy: {
        startDate: "asc",
      },
      include: {
        client: {
          include: {
            user: {
              select: { username: true },
            },
          },
        },
        guestLists: {
          include: {
            guests: true,
          },
        },
      },
    });

    if (events.length === 0) {
      const defaultClient = await ctx.db.clientProfile.findFirst({
        include: { user: { select: { username: true } } },
      });
      
      if (defaultClient) {
        const sampleEventsData = [
          { title: "Summer Beach Party", startDate: new Date(Date.now() + 15 * 24 * 3600 * 1000), endDate: new Date(Date.now() + 16 * 24 * 3600 * 1000), coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800" },
          { title: "Tech Meetup Lagos", startDate: new Date(Date.now() + 30 * 24 * 3600 * 1000), endDate: new Date(Date.now() + 31 * 24 * 3600 * 1000), coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800" },
          { title: "Wedding Reception", startDate: new Date(Date.now() + 45 * 24 * 3600 * 1000), endDate: new Date(Date.now() + 46 * 24 * 3600 * 1000), coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800" },
        ];

        for (const data of sampleEventsData) {
          await ctx.db.clientEvent.create({
            data: {
              title: data.title,
              startDate: data.startDate,
              endDate: data.endDate,
              coverImage: data.coverImage,
              isPublic: true,
              clientProfileId: defaultClient.id,
              location: { display_name: "Lagos, Nigeria" },
            },
          });
        }

        events = await ctx.db.clientEvent.findMany({
          where: {
            isPublic: true,
            endDate: {
              gte: now,
            },
          },
          orderBy: { startDate: "asc" },
          include: {
            client: {
              include: {
                user: { select: { username: true } },
              },
            },
            guestLists: {
              include: { guests: true },
            },
          },
        });
      }
    }

    return events;
  }),

  toggleAttendPublicEvent: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { eventId } = input;
      const userId = ctx.user.id;

      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        include: {
          clientProfile: true,
          vendorProfile: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const displayName = user.vendorProfile?.companyName || user.clientProfile?.name || user.username;
      const email = user.email;

      let guestList = await ctx.db.eventGuestList.findFirst({
        where: {
          eventId,
          title: "Public RSVPs",
        },
      });

      if (!guestList) {
        guestList = await ctx.db.eventGuestList.create({
          data: {
            eventId,
            title: "Public RSVPs",
          },
        });
      }

      const existingGuest = await ctx.db.eventGuest.findFirst({
        where: {
          listId: guestList.id,
          email: email,
        },
      });

      if (existingGuest) {
        await ctx.db.eventGuest.delete({
          where: { id: existingGuest.id },
        });
        return { attending: false };
      } else {
        await ctx.db.eventGuest.create({
          data: {
            listId: guestList.id,
            name: displayName,
            email: email,
            status: "ATTENDING",
          },
        });
        return { attending: true };
      }
    }),

  getUserEvents: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
        include: { clientProfile: true },
      });
      if (!user || !user.clientProfile) {
        return { upcoming: [], past: [] };
      }
      const isOwner = ctx.user?.id === user.id;

      const events = await ctx.db.clientEvent.findMany({
        where: {
          clientProfileId: user.clientProfile.id,
          ...(!isOwner ? { isPublic: true } : {}),
        },
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
        orderBy: { startDate: "asc" },
      });

      const now = new Date();
      const upcoming = events.filter((e) => e.endDate >= now);
      const past = events
        .filter((e) => e.endDate < now)
        .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
      return { upcoming, past };
    }),

  getPublicEventDetails: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.clientEvent.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          coverImage: true,
          location: true,
          isTicketed: true,
          ticketPrice: true,
          questionnaireData: true,
          ticketTiers: true,
          client: {
            select: {
              name: true,
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      return event;
    }),

  publicRsvp: publicProcedure
    .input(
      z.object({
        eventId: z.string(),
        name: z.string().min(2),
        email: z.string().email(),
        whatsAppNumber: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.clientEvent.findUnique({
        where: { id: input.eventId },
        include: { guestLists: true },
      });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }
      if (event.isTicketed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This event is ticketed. Please pay to RSVP.",
        });
      }
      let guestList = event.guestLists[0];
      if (!guestList) {
        guestList = await ctx.db.eventGuestList.create({
          data: { title: "Default Guest List", eventId: event.id },
        });
      }
      const guest = await ctx.db.eventGuest.create({
        data: {
          name: input.name,
          email: input.email,
          whatsAppNumber: input.whatsAppNumber || null,
          status: "ATTENDING",
          listId: guestList.id,
        },
      });
      return { success: true, guestName: guest.name };
    }),

  hireCoordinator: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        coordinatorId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;

      // 1. Fetch event and verify owner is client
      const event = await db.clientEvent.findUnique({
        where: { id: input.eventId },
        include: { client: true, conversation: true },
      });

      if (!event || event.client.userId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to hire a coordinator for this event.",
        });
      }

      if (event.coordinatorId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This event already has an active coordinator hired.",
        });
      }

      // 2. Fetch coordinator profile and user
      const coordinator = await db.coordinatorProfile.findUnique({
        where: { id: input.coordinatorId },
        include: { user: true },
      });

      if (!coordinator) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coordinator profile not found.",
        });
      }

      const price = coordinator.price;

      // 3. Verify client wallet has enough funds
      const clientWallet = await db.wallet.findUnique({
        where: { userId: user.id },
      });

      if (!clientWallet || clientWallet.availableBalance < price) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "INSUFFICIENT_FUNDS",
        });
      }

      const coordinatorWallet = await db.wallet.upsert({
        where: { userId: coordinator.userId },
        create: { userId: coordinator.userId },
        update: {},
      });

      // 4. Perform transaction: Transfer funds, set coordinator, join chat
      return db.$transaction(async (tx) => {
        // Debit client wallet
        await tx.wallet.update({
          where: { userId: user.id },
          data: {
            availableBalance: { decrement: price },
            totalExpenses: { increment: price },
          },
        });

        // Credit coordinator wallet
        await tx.wallet.update({
          where: { userId: coordinator.userId },
          data: {
            availableBalance: { increment: price },
            totalEarnings: { increment: price },
          },
        });

        // Create transaction records
        await tx.transaction.create({
          data: {
            walletId: clientWallet.id,
            type: "SERVICE_FEE",
            amount: -price,
            status: "COMPLETED",
            description: `Hired coordinator @${coordinator.user.username} for event: ${event.title}`,
          },
        });

        await tx.transaction.create({
          data: {
            walletId: coordinatorWallet.id,
            type: "TRANSFER",
            amount: price,
            status: "COMPLETED",
            description: `Hired as coordinator by @${user.username} for event: ${event.title}`,
          },
        });

        // Link coordinator to the event
        const updatedEvent = await tx.clientEvent.update({
          where: { id: event.id },
          data: { coordinatorId: coordinator.id },
        });

        // Auto-join coordinator to the event group chat conversation if exists
        if (event.conversation) {
          await tx.conversationParticipant.upsert({
            where: {
              userId_conversationId: {
                userId: coordinator.userId,
                conversationId: event.conversation.id,
              },
            },
            create: {
              userId: coordinator.userId,
              conversationId: event.conversation.id,
            },
            update: {},
          });
        }

        // Send notification to coordinator
        await tx.notification.create({
          data: {
            userId: coordinator.userId,
            type: "EVENT_INVITATION",
            message: `You have been hired by @${user.username} to coordinate "${event.title}"!`,
            link: `/event/${event.id}/board`,
          },
        });

        return updatedEvent;
      });
    }),
});
