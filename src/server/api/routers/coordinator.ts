import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "@/server/api/trpc";

export const coordinatorRouter = createTRPCRouter({
  /**
   * Validate coordinator access key
   */
  validateKey: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.db.coordinatorAccessKey.findUnique({
        where: { key: input.key },
      });
      return {
        valid: !!record && !record.isUsed,
      };
    }),

  /**
   * Register a new coordinator using an access key (Auto-confirms auth user)
   */
  register: publicProcedure
    .input(
      z.object({
        accessKey: z.string(),
        email: z.string().email("Invalid email address"),
        username: z.string().min(3, "Username must be at least 3 characters").max(30),
        password: z.string().min(6, "Password must be at least 6 characters"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        bio: z.string().min(10, "Bio must be at least 10 characters"),
        price: z.number().min(0, "Price cannot be negative"),
        location: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;

      // 1. Verify access key
      const keyRecord = await db.coordinatorAccessKey.findUnique({
        where: { key: input.accessKey },
      });

      if (!keyRecord) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The access key provided does not exist.",
        });
      }

      if (keyRecord.isUsed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This access key has already been used.",
        });
      }

      // 2. Check username availability
      const existingUser = await db.user.findFirst({
        where: {
          OR: [
            { username: input.username.toLowerCase() },
            { email: input.email.toLowerCase() },
          ],
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Username or email is already in use.",
        });
      }

      // 3. Create user in Supabase Auth via Admin SDK with auto-confirm
      const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseAdminKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Supabase admin configuration is missing.",
        });
      }

      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseAdminKey,
        { auth: { persistSession: false } },
      );

      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: true,
          user_metadata: {
            role: "COORDINATOR",
            username: input.username.toLowerCase(),
          },
        });

      if (authError || !authData.user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: authError?.message ?? "Failed to create authentication user.",
        });
      }

      const userId = authData.user.id;

      // 4. Create database records in a transaction
      return db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            id: userId,
            email: input.email.toLowerCase(),
            username: input.username.toLowerCase(),
            role: "COORDINATOR",
            isOnboarded: true,
          },
        });

        await tx.coordinatorProfile.create({
          data: {
            userId,
            name: input.name,
            bio: input.bio,
            price: input.price,
            location: input.location ?? {},
          },
        });

        await tx.wallet.create({
          data: { userId },
        });

        await tx.coordinatorAccessKey.update({
          where: { id: keyRecord.id },
          data: {
            isUsed: true,
            usedById: userId,
          },
        });

        return { success: true, userId: user.id };
      });
    }),

  /**
   * List all available coordinators for clients to hire
   */
  listAvailable: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.coordinatorProfile.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: { price: "asc" },
    });
  }),

  /**
   * Get events assigned to the current coordinator
   */
  getMyEvents: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.coordinatorProfile.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Coordinator profile not found.",
      });
    }

    return ctx.db.clientEvent.findMany({
      where: { coordinatorId: profile.id },
      include: {
        client: {
          include: {
            user: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: "asc" },
    });
  }),

  /**
   * Admin: List all coordinator access keys
   */
  getKeys: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.coordinatorAccessKey.findMany({
      include: {
        usedBy: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  /**
   * Admin: Generate a new coordinator access key
   */
  generateKey: adminProcedure
    .input(z.object({ name: z.string().optional() }))
    .mutation(async ({ ctx }) => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let randomPart = "";
      for (let i = 0; i < 10; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const key = `CO-${randomPart}`;

      return ctx.db.coordinatorAccessKey.create({
        data: {
          key,
          isUsed: false,
        },
      });
    }),

  /**
   * Admin: Delete an unused coordinator access key
   */
  deleteKey: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const keyRecord = await ctx.db.coordinatorAccessKey.findUnique({
        where: { id: input.id },
      });

      if (!keyRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Access key not found",
        });
      }

      if (keyRecord.isUsed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete a key that has already been used.",
        });
      }

      await ctx.db.coordinatorAccessKey.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get a single coordinator's public profile by username
   */
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
        include: {
          coordinatorProfile: true,
        },
      });

      if (!user?.coordinatorProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coordinator profile not found.",
        });
      }

      const eventsCount = await ctx.db.clientEvent.count({
        where: { coordinatorId: user.coordinatorProfile.id },
      });

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
        profile: user.coordinatorProfile,
        eventsCount,
      };
    }),
});
