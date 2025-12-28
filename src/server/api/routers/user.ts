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
        clientProfile: {
          include: {
            // Count events hosted by this client
            _count: {
              select: { events: true },
            },
          },
        },
        adminProfile: true,
        // Fetch ONLY completed orders to calculate "Hires Made" efficiently
        clientOrders: {
          where: { status: "COMPLETED" },
          select: { id: true, status: true },
        },
      },
    });
  }),

  // Get user by ID (public - for viewing profiles)
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

      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          vendorProfile: {
            include: {
              services: true,
            },
          },
          clientProfile: {
            include: {
              // Include event count for public profile
              _count: {
                select: { events: true },
              },
            },
          },
          // Include completed orders count for public profile
          clientOrders: {
            where: { status: "COMPLETED" },
            select: { id: true, status: true },
          },
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
      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
        include: {
          vendorProfile: {
            include: {
              services: true,
            },
          },
          clientProfile: {
            include: {
              // Include event count
              _count: {
                select: { events: true },
              },
            },
          },
          // Include completed orders
          clientOrders: {
            where: { status: "COMPLETED" },
            select: { id: true, status: true },
          },
        },
      });

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
  // --- ADMIN MANAGEMENT PROCEDURES ---

  /**
   * Get Users with Pagination & Filtering
   * Industry Standard: Never fetch all records. Always paginate.
   */
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

  /**
   * Create User in database after Supabase signup
   * (Your provided code)
   */
  createUser: publicProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email(),
        username: z.string().min(3).max(30),
        role: z.enum(["CLIENT", "VENDOR"]), // We restrict public creation to these roles
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Upsert User (Safe against Trigger race conditions)
      const user = await ctx.db.user.upsert({
        where: { id: input.id },
        update: {
          email: input.email,
          username: input.username,
          role: input.role, // Authoritative source from signup form
        },
        create: {
          id: input.id,
          email: input.email,
          username: input.username,
          role: input.role,
        },
      });

      // 2. Ensure Wallet exists
      await ctx.db.wallet.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });

      // 3. Ensure Profile exists based on Role
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
            kycStatus: "PENDING",
            rating: 0,
            subscriptionStatus: "INACTIVE",
          },
          update: {},
        });
      }

      // Log the creation (System level or new user action)
      // We pass 'ctx' even though user might not be fully session-hydrated yet,
      // but usually 'publicProcedure' implies we assume success if no error thrown.
      return user;
    }),

  /**
   * Admin Create User (For Admins creating other Admins)
   */
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

      // Log it
      await logActivity({
        ctx,
        action: "USER_CREATE_ADMIN",
        entityType: "USER",
        entityId: user.id,
        details: { role: input.role },
      });

      return user;
    }),

  suspendUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string(),
        durationDays: z.number().optional(), // If undefined = Permanent Ban
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

      return updated;
    }),

  // 3. Restore User
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

      return updated;
    }),

  /**
   * Delete User (Admin Only)
   * Hard delete per schema.
   */
  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      ctx.auditFlags.disabled = true;

      // Prevent deleting self
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

      return deleted;
    }),

  /**
   * Update Role (Admin Only)
   */
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
                select: { events: true }, // Count events created
              },
            },
          },
          vendorProfile: {
            include: {
              _count: {
                select: { services: true }, // Count services offered
              },
            },
          },
          adminProfile: true,
          _count: {
            select: {
              clientOrders: true, // Orders placed
              vendorOrders: true, // Orders received
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
