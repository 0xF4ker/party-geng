import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  onboardingProcedure,
} from "@/server/api/trpc";
import { createClient } from "@/utils/supabase/server";
import { supabase } from "@/lib/supabase";

export const authRouter = createTRPCRouter({
  /**
   * Create user in database after Supabase signup
   * This acts as a confirmation/sync step. The DB trigger usually handles this,
   * but this mutation ensures the record exists and related profiles are set up
   * correctly, handling any race conditions or trigger failures.
   */
  createUser: onboardingProcedure
    .input(
      z.object({
        email: z.string().email(),
        username: z.string().min(3).max(30),
        role: z.enum(["CLIENT", "VENDOR"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authUser?.id;
      const user = await ctx.db.user.upsert({
        where: { id: userId },
        update: {
          email: input.email,
          username: input.username,
          role: input.role,
        },
        create: {
          id: userId,
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

      return user;
    }),

  /**
   * Check if username is available
   */
  checkUsername: publicProcedure
    .input(z.object({ username: z.string().min(3).max(30) }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
      });

      return {
        available: !user,
      };
    }),

  /**
   * Check if email exists
   */
  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      return {
        exists: !!user,
      };
    }),

  /**
   * Get current session user
   */
  getSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    return ctx.user;
  }),

  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error.message,
        });
      }

      return data.session;
    }),

  /**
   * Sign out (clear session)
   */
  signOut: protectedProcedure.mutation(async () => {
    return { success: true };
  }),

  healAccount: publicProcedure.mutation(async ({ ctx }) => {
    const { db } = ctx;

    const supabase = await createClient();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser?.email) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to heal your account.",
      });
    }

    const dbUser = await db.user.findUnique({
      where: { id: authUser.id },
      include: {
        wallet: true,
        clientProfile: true,
        vendorProfile: true,
      },
    });

    if (dbUser) {
      if (!dbUser.wallet) {
        await db.wallet.create({
          data: {
            userId: dbUser.id,
          },
        });
      }

      if (dbUser.role === "CLIENT" && !dbUser.clientProfile) {
        await db.clientProfile.create({
          data: { userId: dbUser.id },
        });
      } else if (dbUser.role === "VENDOR" && !dbUser.vendorProfile) {
        await db.vendorProfile.create({
          data: { userId: dbUser.id },
        });
      }

      return { success: true, status: "repaired" };
    }

    const metadata = (authUser.user_metadata || {}) as {
      username?: string;
      role?: string;
    };

    const fallbackUsername = authUser.email.split("@")[0] ?? "user";
    const finalUsername = metadata.username ?? fallbackUsername;
    const role = metadata.role === "VENDOR" ? "VENDOR" : "CLIENT";

    await db.user.create({
      data: {
        id: authUser.id,
        email: authUser.email,
        username: finalUsername,
        role: role,

        wallet: {
          create: {},
        },

        vendorProfile:
          role === "VENDOR"
            ? {
                create: {},
              }
            : undefined,

        clientProfile:
          role === "CLIENT"
            ? {
                create: {},
              }
            : undefined,
      },
    });

    return { success: true, status: "created" };
  }),
});
