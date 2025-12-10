import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { createClient } from "@/utils/supabase/server";

export const authRouter = createTRPCRouter({
  /**
   * Create user in database after Supabase signup
   * This should be called from a webhook or after successful Supabase signup
   */
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
      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { id: input.id },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists",
        });
      }

      // Check if username is taken
      const existingUsername = await ctx.db.user.findUnique({
        where: { username: input.username },
      });

      if (existingUsername) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already taken",
        });
      }

      // Create user
      const user = await ctx.db.user.create({
        data: {
          id: input.id,
          email: input.email,
          username: input.username,
          role: input.role,
        },
      });

      // Create profile based on role
      if (input.role === "CLIENT") {
        await ctx.db.clientProfile.create({
          data: {
            userId: user.id,
          },
        });
      } else if (input.role === "VENDOR") {
        await ctx.db.vendorProfile.create({
          data: {
            userId: user.id,
          },
        });
      }

      // Create wallet for user
      await ctx.db.wallet.create({
        data: {
          userId: user.id,
        },
      });

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

  /**
   * Sign out (clear session)
   */
  signOut: protectedProcedure.mutation(async () => {
    // The actual sign out will be handled by Supabase client
    // This is just a placeholder for any server-side cleanup
    return { success: true };
  }),

  healAccount: publicProcedure.mutation(async ({ ctx }) => {
    const { db } = ctx;

    // 1. Verify user authentication via Supabase
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

    // 2. Check if the user exists AND check for their relations
    const dbUser = await db.user.findUnique({
      where: { id: authUser.id },
      include: {
        wallet: true,
        clientProfile: true,
        vendorProfile: true,
      },
    });

    // --- SCENARIO A: User exists, but might be incomplete (The "Previous Heal" fix) ---
    if (dbUser) {
      // 1. Fix Missing Wallet
      if (!dbUser.wallet) {
        await db.wallet.create({
          data: {
            userId: dbUser.id,
          },
        });
      }

      // 2. Fix Missing Profile based on their existing DB role
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

    // --- SCENARIO B: User does not exist at all (The "Fresh Heal") ---

    // Prepare metadata
    const metadata = (authUser.user_metadata || {}) as {
      username?: string;
      role?: string;
    };

    const fallbackUsername = authUser.email.split("@")[0] ?? "user";
    const finalUsername = metadata.username ?? fallbackUsername;
    const role = metadata.role === "VENDOR" ? "VENDOR" : "CLIENT";

    // Create everything in one go
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
