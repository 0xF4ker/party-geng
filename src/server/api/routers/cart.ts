import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ContributionType, OrderStatus, TransactionType } from "@prisma/client";

export const cartRouter = createTRPCRouter({
  // Get the current user's cart
  get: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx;
    const userId = user.id;

    const cart = await db.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            quote: {
              include: {
                vendor: {
                  include: {
                    vendorProfile: true,
                  },
                },
              },
            },
            wishlistItem: {
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
            },
          },
        },
      },
    });

    return cart;
  }),

  // Add an item to the cart
  addItem: protectedProcedure
    .input(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("QUOTE"),
          quoteId: z.string(),
        }),
        z.object({
          type: z.literal("WISHLIST_ITEM"),
          wishlistItemId: z.string(),
          contributionType: z.nativeEnum(ContributionType),
          amount: z.number().optional(),
        }),
      ]),
    )
    .mutation(async ({ ctx, input }) => {
      const { user, db } = ctx;

      const cart = await db.cart.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });

      if (input.type === "QUOTE") {
        const { quoteId } = input;
        const existingItem = await db.cartItem.findUnique({
          where: { cartId_quoteId: { cartId: cart.id, quoteId } },
        });
        if (existingItem) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This quote is already in your cart.",
          });
        }

        const quote = await db.quote.findUnique({ where: { id: quoteId } });
        if (
          !quote ||
          quote.clientId !== user.id ||
          quote.status !== "PENDING"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This quote cannot be added to the cart.",
          });
        }

        return db.cartItem.create({
          data: { cartId: cart.id, quoteId },
        });
      }

      if (input.type === "WISHLIST_ITEM") {
        const { wishlistItemId, contributionType, amount } = input;
        const existingItem = await db.cartItem.findUnique({
          where: { cartId_wishlistItemId: { cartId: cart.id, wishlistItemId } },
        });
        if (existingItem) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This item is already in your cart.",
          });
        }

        if (contributionType === "CASH" && (!amount || amount <= 0)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A valid amount is required for cash contributions.",
          });
        }

        return db.cartItem.create({
          data: {
            cartId: cart.id,
            wishlistItemId,
            contributionType,
            amount,
          },
        });
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid item type",
      });
    }),

  // Remove an item from the cart
  removeItem: protectedProcedure
    .input(z.object({ cartItemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user, db } = ctx;
      const { cartItemId } = input;
      const cartItem = await db.cartItem.findFirst({
        where: { id: cartItemId, cart: { userId: user.id } },
      });
      if (!cartItem) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Item not found in your cart.",
        });
      }
      await db.cartItem.delete({ where: { id: cartItemId } });
      return { success: true };
    }),

  // Checkout the entire cart
  checkout: protectedProcedure.mutation(async ({ ctx }) => {
    const { user, db } = ctx;
    const cart = await db.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            quote: true,
            wishlistItem: {
              include: {
                wishlist: { include: { event: { include: { client: true } } } },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Your cart is empty.",
      });
    }

    const totalCost = cart.items.reduce((acc, item) => {
      if (item.quote) return acc + item.quote.price;
      if (item.contributionType === "CASH" && item.amount)
        return acc + item.amount;
      return acc;
    }, 0);

    const wallet = await db.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet || wallet.availableBalance < totalCost) {
      throw new TRPCError({ code: "CONFLICT", message: "Insufficient funds." });
    }

    await db.$transaction(async (prisma) => {
      await prisma.wallet.update({
        where: { userId: user.id },
        data: { availableBalance: { decrement: totalCost } },
      });
      for (const item of cart.items) {
        if (item.quote) {
          const { quote } = item;
          const newOrder = await prisma.order.create({
            data: {
              quoteId: quote.id,
              clientId: quote.clientId,
              vendorId: quote.vendorId,
              amount: quote.price,
              status: OrderStatus.ACTIVE,
              eventDate: quote.eventDate,
            },
          });
          await prisma.quote.update({
            where: { id: quote.id },
            data: { status: "ACCEPTED" },
          });
          await prisma.wallet.update({
            where: { userId: quote.vendorId },
            data: { activeOrderBalance: { increment: quote.price } },
          });
          await prisma.transaction.createMany({
            data: [
              {
                walletId: wallet.id,
                orderId: newOrder.id,
                type: TransactionType.PAYMENT,
                amount: -quote.price,
                status: "COMPLETED",
                description: `Payment for quote: ${quote.title}`,
              },
              {
                walletId: (await prisma.wallet.findUnique({
                  where: { userId: quote.vendorId },
                }))!.id,
                orderId: newOrder.id,
                type: TransactionType.SERVICE_FEE,
                amount: quote.price,
                status: "HELD",
                description: `Funds in escrow for: ${quote.title}`,
              },
            ],
          });
        } else if (item.wishlistItem) {
          const { wishlistItem } = item;
          if (item.contributionType === "CASH" && item.amount) {
            const host = wishlistItem.wishlist.event.client;
            await prisma.wallet.update({
              where: { userId: host.userId },
              data: { availableBalance: { increment: item.amount } },
            });
            await prisma.transaction.createMany({
              data: [
                {
                  walletId: wallet.id,
                  type: TransactionType.GIFT,
                  amount: -item.amount,
                  status: "COMPLETED",
                  description: `Gift contribution for ${wishlistItem.name}`,
                },
                {
                  walletId: (await prisma.wallet.findUnique({
                    where: { userId: host.userId },
                  }))!.id,
                  type: TransactionType.GIFT,
                  amount: item.amount,
                  status: "COMPLETED",
                  description: `Received gift for ${wishlistItem.name} from ${user.username}`,
                },
              ],
            });
          }
          await prisma.wishlistContribution.create({
            data: {
              wishlistItemId: wishlistItem.id,
              guestUserId: user.id,
              guestName: user.username,
              type: item.contributionType!,
              amount: item.amount,
            },
          });
        }
      }
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    });
    return { success: true };
  }),
});
