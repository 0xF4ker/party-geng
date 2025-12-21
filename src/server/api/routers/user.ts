import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        vendorProfile: {
          include: {
            services: true,
          },
        },
        clientProfile: true,
      },
    });
  }),

  // Get user by ID (public - for viewing profiles)
  getById: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check for blocks if user is logged in
      if (ctx.user) {
        const block = await ctx.db.block.findFirst({
          where: {
            OR: [
              { blockerId: ctx.user.id, blockedId: input.userId },
              { blockerId: input.userId, blockedId: ctx.user.id },
            ],
          },
        });

        if (block) {
          throw new TRPCError({
            code: "NOT_FOUND", // Mask as not found for privacy
            message: "User not found",
          });
        }
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          vendorProfile: {
            include: {
              services: true,
            },
          },
          clientProfile: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),

  // Get user by username (public - for viewing profiles)
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      // First find the user to get their ID for block check
      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
        include: {
          vendorProfile: {
            include: {
              services: true,
            },
          },
          clientProfile: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check for blocks if user is logged in
      if (ctx.user) {
        const block = await ctx.db.block.findFirst({
          where: {
            OR: [
              { blockerId: ctx.user.id, blockedId: user.id },
              { blockerId: user.id, blockedId: ctx.user.id },
            ],
          },
        });

        if (block) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
      }

      return user;
    }),

  // --- Blocking Features ---

  blockUser: protectedProcedure
    .input(z.object({ userIdToBlock: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userIdToBlock === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot block yourself.",
        });
      }

      // Check if already blocked
      const existingBlock = await ctx.db.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: ctx.user.id,
            blockedId: input.userIdToBlock,
          },
        },
      });

      if (existingBlock) return existingBlock;

      return ctx.db.block.create({
        data: {
          blockerId: ctx.user.id,
          blockedId: input.userIdToBlock,
        },
      });
    }),

  unblockUser: protectedProcedure
    .input(z.object({ userIdToUnblock: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.block.delete({
        where: {
          blockerId_blockedId: {
            blockerId: ctx.user.id,
            blockedId: input.userIdToUnblock,
          },
        },
      });
    }),

  getBlockedUsers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.block.findMany({
      where: { blockerId: ctx.user.id },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            clientProfile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
            vendorProfile: {
              select: {
                companyName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }),
});
