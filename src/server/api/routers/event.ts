import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { appRouter } from "@/server/api/root";
import { GuestStatus } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

export const eventRouter = createTRPCRouter({
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
      const event = await ctx.db.clientEvent.findUnique({
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
          todos: {
            include: {
              items: true,
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
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      const isOwner = event.client.userId === ctx.user.id;
      const isParticipant =
        event.conversation?.participants.some((p) => p.id === ctx.user.id) ??
        false;

      if (!isOwner && !isParticipant && !event.isPublic) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this event",
        });
      }

      return event;
    }),

  // Create event
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        date: z.date(),
        location: z.string().optional(),
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

      return ctx.db.clientEvent.create({
        data: {
          title: input.title,
          date: input.date,
          location: input.location,
          coverImage: input.coverImage,
          clientProfileId: clientProfile.id,
          budget: {
            create: {},
          },
          todos: {
            create: [
              { title: "To Do", order: 0 },
              { title: "In Progress", order: 1 },
              { title: "Done", order: 2 },
            ],
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
                connect: [{ id: ctx.user.id }],
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
        location: z.string().optional(),
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
        event.conversation?.participants.some((p) => p.id === ctx.user.id) ??
        false;

      if (!isOwner && !isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this event",
        });
      }

      return ctx.db.clientEvent.update({
        where: { id: input.id },
        data: {
          title: input.title,
          date: input.date,
          location: input.location,
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

      if (!event || event.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this event",
        });
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

  addEmptyTodoList: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.clientEvent.findUnique({
        where: { id: input.eventId },
        include: { client: true, todos: true, conversation: { include: { participants: true } } },
      });
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });

      const isOwner = event.client.userId === ctx.user.id;
      const isParticipant = event.conversation?.participants.some(p => p.id === ctx.user.id) ?? false;

      if (!isOwner && !isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this event",
        });
      }
      return ctx.db.eventTodoList.create({
        data: {
          eventId: input.eventId,
          title: input.title,
          order: event.todos.length,
        },
      });
    }),

  updateTodoItem: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        content: z.string().optional(),
        order: z.number().optional(),
        listId: z.string().optional(),
        assignedToId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { itemId, ...data } = input;
      const item = await ctx.db.eventTodoItem.findUnique({
        where: { id: itemId },
        include: {
          list: { include: { event: { include: { client: true, conversation: { include: { participants: true }} } } } },
        },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      const event = item.list.event;
      const isOwner = event.client.userId === ctx.user.id;
      const isParticipant = event.conversation?.participants.some(p => p.id === ctx.user.id) ?? false;

      if (!isOwner && !isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this event",
        });
      }
      return ctx.db.eventTodoItem.update({ where: { id: itemId }, data });
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
      return ctx.db.eventBudgetItem.update({ where: { id: itemId }, data });
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
            status: 'PENDING',
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
            include: { list: { include: { event: { include: { client: true } } } } },
        });

        if (!guest || guest.list.event.client.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You do not have permission." });
        }

        const invitationToken = createId();
        await ctx.db.eventGuest.update({
            where: { id: input.guestId },
            data: { invitationToken },
        });

        const invitationLink = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/invitation/${invitationToken}`;
        
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

  deleteTodoList: protectedProcedure
    .input(z.object({ listId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const list = await ctx.db.eventTodoList.findUnique({
        where: { id: input.listId },
        include: { event: { include: { client: true, conversation: { include: { participants: true } } } } },
      });
      if (!list) throw new TRPCError({ code: "NOT_FOUND" });
      const event = list.event;
      const isOwner = event.client.userId === ctx.user.id;
      const isParticipant = event.conversation?.participants.some(p => p.id === ctx.user.id) ?? false;

      if (!isOwner && !isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this list",
        });
      }
      await ctx.db.eventTodoList.delete({ where: { id: input.listId } });
      return { success: true };
    }),

  updateTodoList: protectedProcedure
    .input(z.object({ listId: z.string(), title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const list = await ctx.db.eventTodoList.findUnique({
        where: { id: input.listId },
        include: { event: { include: { client: true, conversation: { include: { participants: true } } } } },
      });
      if (!list) throw new TRPCError({ code: "NOT_FOUND" });
      const event = list.event;
      const isOwner = event.client.userId === ctx.user.id;
      const isParticipant = event.conversation?.participants.some(p => p.id === ctx.user.id) ?? false;
      
      if (!isOwner && !isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this list",
        });
      }
      return ctx.db.eventTodoList.update({
        where: { id: input.listId },
        data: { title: input.title },
      });
    }),

  addTodoItem: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        content: z.string(),
        order: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const list = await ctx.db.eventTodoList.findUnique({
        where: { id: input.listId },
        include: { event: { include: { client: true, conversation: { include: { participants: true } } } } },
      });
      if (!list) throw new TRPCError({ code: "NOT_FOUND" });
      const event = list.event;
      const isOwner = event.client.userId === ctx.user.id;
      const isParticipant = event.conversation?.participants.some(p => p.id === ctx.user.id) ?? false;

      if (!isOwner && !isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to add to this list",
        });
      }
      return ctx.db.eventTodoItem.create({
        data: {
          listId: input.listId,
          content: input.content,
          order: input.order,
        },
      });
    }),

  deleteTodoItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.eventTodoItem.findUnique({
        where: { id: input.itemId },
        include: {
          list: { include: { event: { include: { client: true, conversation: { include: { participants: true } } } } } },
        },
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      const event = item.list.event;
      const isOwner = event.client.userId === ctx.user.id;
      const isParticipant = event.conversation?.participants.some(p => p.id === ctx.user.id) ?? false;

      if (!isOwner && !isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this item",
        });
      }
      await ctx.db.eventTodoItem.delete({ where: { id: input.itemId } });
      return { success: true };
    }),
});