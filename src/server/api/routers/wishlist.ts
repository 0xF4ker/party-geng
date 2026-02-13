import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  ContributionType,
  WishlistItemType,
  NotificationType,
} from "@prisma/client";
import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "@/server/db";

// --- 1. CACHED QUERY ---

const getCachedWishlist = async (eventId: string) => {
  return unstable_cache(
    async () => {
      return await db.clientEvent.findUnique({
        where: { id: eventId },
        include: {
          client: {
            include: {
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
          wishlist: {
            include: {
              items: {
                include: {
                  contributions: {
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
    },
    [`wishlist-${eventId}`], // Specific Cache Key
    {
      tags: [`wishlist-${eventId}`], // Specific Invalidation Tag
      revalidate: 3600,
    },
  )();
};

// --- 2. ROUTER ---

export const wishlistRouter = createTRPCRouter({
  // Get wishlist by event ID (public - for guests)
  getByEventId: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await getCachedWishlist(input.eventId);

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

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
        itemType: z.nativeEnum(WishlistItemType),
        requestedAmount: z.number().optional(),
        imageUrl: z.string().optional(),
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

      let wishlist = event.wishlist;
      wishlist ??= await ctx.db.wishlist.create({
        data: {
          clientEventId: input.eventId,
        },
      });

      const result = await ctx.db.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          name: input.name,
          itemType: input.itemType,
          requestedAmount: input.requestedAmount,
          imageUrl: input.imageUrl,
        },
      });

      // FIX: Added "default"
      revalidateTag(`wishlist-${input.eventId}`, "default");

      return result;
    }),

  // Update item
  updateItem: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        name: z.string().optional(),
        itemType: z.nativeEnum(WishlistItemType).optional(),
        requestedAmount: z.number().optional(),
        isFulfilled: z.boolean().optional(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.wishlistItem.findUnique({
        where: { id: input.itemId },
        include: {
          wishlist: {
            include: {
              event: {
                include: { client: true },
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

      const { ...data } = input;

      const result = await ctx.db.wishlistItem.update({
        where: { id: input.itemId },
        data: data,
      });

      // FIX: Added "default"
      revalidateTag(`wishlist-${item.wishlist.event.id}`, "default");

      return result;
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
                include: { client: true },
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

      // FIX: Added "default"
      revalidateTag(`wishlist-${item.wishlist.event.id}`, "default");

      return { success: true };
    }),

  // Contribute to item
  contributeToItem: publicProcedure
    .input(
      z.object({
        itemId: z.string(),
        guestName: z.string(),
        type: z.nativeEnum(ContributionType),
        amount: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.wishlistItem.findUnique({
        where: { id: input.itemId },
        include: {
          contributions: true,
          wishlist: {
            include: {
              event: {
                include: {
                  client: { select: { userId: true } },
                },
              },
            },
          },
        },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found",
        });
      }

      if (
        input.type === ContributionType.PROMISE &&
        item.itemType !== WishlistItemType.ITEM_REQUEST
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can only make promises on item requests.",
        });
      }

      if (input.type === ContributionType.PROMISE && ctx.user) {
        if (
          item.contributions.some(
            (c) =>
              c.guestUserId === ctx.user?.id &&
              c.type === ContributionType.PROMISE,
          )
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You have already promised this item",
          });
        }
      }

      const contribution = await ctx.db.wishlistContribution.create({
        data: {
          wishlistItemId: input.itemId,
          guestUserId: ctx.user?.id,
          guestName: input.guestName,
          type: input.type,
          amount: input.amount,
        },
      });

      if (item?.wishlist.event.client.userId) {
        await ctx.db.notification.create({
          data: {
            userId: item.wishlist.event.client.userId,
            type: NotificationType.WISHLIST_CONTRIBUTION,
            message: `${input.guestName} has contributed to your wishlist item "${item.name}"`,
            link: `/event/${item.wishlist.event.id}`,
          },
        });
      }

      // FIX: Added "default"
      revalidateTag(`wishlist-${item.wishlist.event.id}`, "default");

      return contribution;
    }),

  // Remove contribution
  removeContribution: protectedProcedure
    .input(z.object({ contributionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const contribution = await ctx.db.wishlistContribution.findUnique({
        where: { id: input.contributionId },
        include: {
          item: {
            include: {
              wishlist: {
                include: {
                  event: {
                    include: { client: true },
                  },
                },
              },
            },
          },
        },
      });

      if (
        !contribution ||
        (contribution.guestUserId !== ctx.user.id &&
          contribution.item.wishlist.event.client.userId !== ctx.user.id)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to remove this contribution",
        });
      }

      await ctx.db.wishlistContribution.delete({
        where: { id: input.contributionId },
      });

      // FIX: Added "default"
      revalidateTag(
        `wishlist-${contribution.item.wishlist.event.id}`,
        "default",
      );

      return { success: true };
    }),
});
