import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

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
                promises: true,
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
                  promises: true,
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

  // Create event
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        date: z.date(),
        coverImage: z.string().optional(),
      })
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
          coverImage: input.coverImage,
          clientProfileId: clientProfile.id,
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
        coverImage: z.string().optional(),
        isPublic: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.clientEvent.findUnique({
        where: { id: input.id },
        include: { client: true },
      });

      if (!event || event.client.userId !== ctx.user.id) {
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

      return ctx.db.eventVendor.create({
        data: {
          eventId: input.eventId,
          vendorId: input.vendorId,
        },
      });
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
});
