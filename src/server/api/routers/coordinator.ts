import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
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
});
