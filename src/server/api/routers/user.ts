import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { logActivity } from "../services/activityLogger";
import type { Prisma } from "@prisma/client";
import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "@/server/db";

// --- 1. CACHED PROFILE FETCHERS ---

// Cache the heavy profile lookup by Username
const getCachedUserByUsername = unstable_cache(
  async (username: string) => {
    return await db.user.findUnique({
      where: { username },
      include: {
        vendorProfile: {
          include: {
            services: true,
          },
        },
        clientProfile: {
          include: {
            _count: {
              select: { events: true },
            },
          },
        },
        clientOrders: {
          where: { status: "COMPLETED" },
          select: { id: true, status: true },
        },
      },
    });
  },
  ["user-profile-by-username"],
  {
    revalidate: 3600,
    tags: ["users"],
  },
);

// Cache the heavy profile lookup by ID
const getCachedUserById = unstable_cache(
  async (userId: string) => {
    return await db.user.findUnique({
      where: { id: userId },
      include: {
        vendorProfile: {
          include: {
            services: true,
          },
        },
        clientProfile: {
          include: {
            _count: {
              select: { events: true },
            },
          },
        },
        clientOrders: {
          where: { status: "COMPLETED" },
          select: { id: true, status: true },
        },
      },
    });
  },
  ["user-profile-by-id"],
  {
    revalidate: 3600,
    tags: ["users"],
  },
);

// --- 2. ROUTER ---

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(({ ctx }) => {
    // Session data - Do not cache server-side
    return ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        vendorProfile: {
          include: {
            services: true,
          },
        },
        clientProfile: {
          include: {
            _count: {
              select: { events: true },
            },
          },
        },
        adminProfile: true,
        clientOrders: {
          where: { status: "COMPLETED" },
          select: { id: true, status: true },
        },
      },
    });
  }),

  // Get user by ID (Uses Cache)
  getById: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
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
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
      }

      const user = await getCachedUserById(input.userId);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),

  // Get user by Username (Uses Cache)
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await getCachedUserByUsername(input.username);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

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

  // --- ADMIN MANAGEMENT PROCEDURES ---

  getUsers: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        role: z
          .enum(["CLIENT", "VENDOR", "ADMIN", "SUPPORT", "FINANCE"])
          .optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, role, search } = input;
      const where: Prisma.UserWhereInput = {
        role: role ?? undefined,
        OR: search
          ? [
              { email: { contains: search, mode: "insensitive" } },
              { username: { contains: search, mode: "insensitive" } },
            ]
          : undefined,
      };

      const items = await ctx.db.user.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          clientProfile: { select: { name: true, avatarUrl: true } },
          vendorProfile: { select: { companyName: true, avatarUrl: true } },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return { items, nextCursor };
    }),

  createUser: publicProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email(),
        username: z.string().min(3).max(30),
        role: z.enum(["CLIENT", "VENDOR"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.user.findUnique({
        where: { username: input.username },
      });

      if (existingUser && existingUser.id !== input.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username is already taken.",
        });
      }

      const user = await ctx.db.user.upsert({
        where: { id: input.id },
        update: {
          email: input.email,
          username: input.username,
          role: input.role,
        },
        create: {
          id: input.id,
          email: input.email,
          username: input.username,
          role: input.role,
        },
      });

      await ctx.db.wallet.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });

      if (input.role === "CLIENT") {
        await ctx.db.clientProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        });
      } else if (input.role === "VENDOR") {
        await ctx.db.vendorProfile.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            kybStatus: "PENDING",
            rating: 0,
            subscriptionStatus: "INACTIVE",
          },
          update: {},
        });
      }

      // INVALIDATE CACHE (FIXED: Using 'default' string)
      revalidateTag("users", "default");

      return user;
    }),

  adminCreateUser: adminProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email(),
        username: z.string(),
        role: z.enum(["ADMIN", "SUPPORT", "FINANCE"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      ctx.auditFlags.disabled = true;

      const user = await ctx.db.user.create({
        data: {
          id: input.id,
          email: input.email,
          username: input.username,
          role: input.role,
        },
      });

      await logActivity({
        ctx,
        action: "USER_CREATE_ADMIN",
        entityType: "USER",
        entityId: user.id,
        details: { role: input.role },
      });

      // INVALIDATE CACHE (FIXED)
      revalidateTag("users", "default");

      return user;
    }),

  suspendUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string(),
        durationDays: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      ctx.auditFlags.disabled = true;

      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot suspend yourself.",
        });
      }

      const suspendedUntil = input.durationDays
        ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000)
        : null;

      const updated = await ctx.db.user.update({
        where: { id: input.userId },
        data: {
          status: input.durationDays ? "SUSPENDED" : "BANNED",
          suspensionReason: input.reason,
          suspendedUntil: suspendedUntil,
        },
      });

      await logActivity({
        ctx,
        action: input.durationDays ? "USER_SUSPEND" : "USER_BAN",
        entityType: "USER",
        entityId: input.userId,
        details: {
          reason: input.reason,
          duration: input.durationDays ?? "Permanent",
        },
      });

      // INVALIDATE CACHE (FIXED)
      revalidateTag("users", "default");

      return updated;
    }),

  restoreUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      ctx.auditFlags.disabled = true;

      const updated = await ctx.db.user.update({
        where: { id: input.userId },
        data: {
          status: "ACTIVE",
          suspensionReason: null,
          suspendedUntil: null,
        },
      });

      await logActivity({
        ctx,
        action: "USER_RESTORE",
        entityType: "USER",
        entityId: input.userId,
      });

      // INVALIDATE CACHE (FIXED)
      revalidateTag("users", "default");

      return updated;
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      ctx.auditFlags.disabled = true;

      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete yourself.",
        });
      }

      const deleted = await ctx.db.user.delete({
        where: { id: input.userId },
      });

      await logActivity({
        ctx,
        action: "USER_DELETE",
        entityType: "USER",
        entityId: input.userId,
        details: { email: deleted.email, role: deleted.role },
      });

      // INVALIDATE CACHE (FIXED)
      revalidateTag("users", "default");

      return deleted;
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        newRole: z.enum(["CLIENT", "VENDOR", "ADMIN", "SUPPORT", "FINANCE"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      ctx.auditFlags.disabled = true;

      const updated = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.newRole },
      });

      await logActivity({
        ctx,
        action: "USER_ROLE_UPDATE",
        entityType: "USER",
        entityId: input.userId,
        details: { newRole: input.newRole },
      });

      // INVALIDATE CACHE (FIXED)
      revalidateTag("users", "default");

      return updated;
    }),

  adminGetUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          wallet: true,
          clientProfile: {
            include: {
              _count: {
                select: { events: true },
              },
            },
          },
          vendorProfile: {
            include: {
              _count: {
                select: { services: true },
              },
            },
          },
          adminProfile: true,
          _count: {
            select: {
              clientOrders: true,
              vendorOrders: true,
              authoredReviews: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return user;
    }),
});
