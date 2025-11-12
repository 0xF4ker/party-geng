import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const wishlistRouter = createTRPCRouter({
  // Get wishlist by event ID (public - for guests)
  getByEventId: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.clientEvent.findUnique({
        where: { id: input.eventId },
        include: {
          client: {
            select: {
              name: true,
              avatarUrl: true,
            },
            include: {
              user: true,
            },
          },
          wishlist: {
            include: {
              items: {
                include: {
                  promises: {
                    include: {
                      guestUser: {
                        include: {
                          clientProfile: true,
                        },
                      },
                    },
                  },
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

      // Only show public events to non-owners
      if (
        !event.isPublic &&
        (!ctx.user || ctx.user.id !== event.client.userId)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This event is private",
        });
      }

      return event;
    }),

  // Add item to wishlist
  addItem: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        name: z.string(),
        price: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.clientEvent.findUnique({
        where: { id: input.eventId },
        include: { client: true, wishlist: true },
      });

      if (!event || event.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this wishlist",
        });
      }

      // Create wishlist if it doesn't exist
      let wishlist = event.wishlist;
      wishlist ??= await ctx.db.wishlist.create({
          data: {
            clientEventId: input.eventId,
          },
        });

      return ctx.db.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          name: input.name,
          price: input.price,
        },
      });
    }),

  // Update item
  updateItem: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        name: z.string().optional(),
        price: z.number().optional(),
        isFulfilled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.wishlistItem.findUnique({
        where: { id: input.itemId },
        include: {
          wishlist: {
            include: {
              event: {
                include: {
                  client: true,
                },
              },
            },
          },
        },
      });

      if (!item || item.wishlist.event.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to edit this item",
        });
      }

      return ctx.db.wishlistItem.update({
        where: { id: input.itemId },
        data: {
          name: input.name,
          price: input.price,
          isFulfilled: input.isFulfilled,
        },
      });
    }),

  // Delete item
  deleteItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.wishlistItem.findUnique({
        where: { id: input.itemId },
        include: {
          wishlist: {
            include: {
              event: {
                include: {
                  client: true,
                },
              },
            },
          },
        },
      });

      if (!item || item.wishlist.event.client.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this item",
        });
      }

      await ctx.db.wishlistItem.delete({
        where: { id: input.itemId },
      });

      return { success: true };
    }),

  // Promise item (by guest or logged-in user)
  promiseItem: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        guestName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.wishlistItem.findUnique({
        where: { id: input.itemId },
        include: {
          promises: true,
        },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found",
        });
      }

      // Check if user already promised this item
      const existingPromise = item.promises.find(
        (p) => p.guestUserId === ctx.user.id,
      );

      if (existingPromise) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already promised this item",
        });
      }

      return ctx.db.wishlistPromise.create({
        data: {
          wishlistItemId: input.itemId,
          guestUserId: ctx.user.id,
          guestName: input.guestName,
        },
      });
    }),

  // Remove promise
  removePromise: protectedProcedure
    .input(z.object({ promiseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const promise = await ctx.db.wishlistPromise.findUnique({
        where: { id: input.promiseId },
      });

      if (!promise || promise.guestUserId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to remove this promise",
        });
      }

      await ctx.db.wishlistPromise.delete({
        where: { id: input.promiseId },
      });

      return { success: true };
    }),
});
