// src/server/api/trpc.ts

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
// FIX 1: Import Prisma as a value (remove 'type' keyword) so we can use Prisma.InputJsonValue
import { Prisma } from "@prisma/client";

import { db } from "@/server/db";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 1. CONTEXT
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Handle cookie setting errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Handle cookie removal errors
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? await db.user.findUnique({ where: { id: user.id } })
    : null;

  return {
    db,
    supabase,
    user: profile,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

/**
 * 3. MIDDLEWARE & PROCEDURES
 */

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  const result = await next();
  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);
  return result;
});

// --- TYPE-SAFE LOGGING HELPERS ---

/**
 * Helper to safely extract an ID from unknown input.
 * Checks for common ID fields (id, orderId, etc.)
 */
function extractEntityId(input: unknown): string | undefined {
  if (!input || typeof input !== "object" || input === null) return undefined;

  // Type guard to safely check property existence
  const hasKey = <K extends string>(
    obj: object,
    key: K,
  ): obj is Record<K, unknown> => {
    return key in obj;
  };

  if (hasKey(input, "id") && typeof input.id === "string") return input.id;
  if (hasKey(input, "orderId") && typeof input.orderId === "string")
    return input.orderId;
  if (hasKey(input, "eventId") && typeof input.eventId === "string")
    return input.eventId;
  if (hasKey(input, "quoteId") && typeof input.quoteId === "string")
    return input.quoteId;

  return undefined;
}

/**
 * Activity Logging Middleware
 */
const activityLoggerMiddleware = t.middleware(async (opts) => {
  // Destructure common fields directly
  const { ctx, next, path, type } = opts;

  const result = await next();

  // FIX 2: Safely access rawInput by asserting the opts shape.
  // We use `unknown` to strictly avoid `any`.
  // This tells TS: "opts has a rawInput property, but we don't know what it contains yet."
  const rawInput = (opts as { rawInput?: unknown }).rawInput;

  // Only log if:
  // 1. Mutation (Write)
  // 2. Success
  // 3. Authenticated User
  if (type === "mutation" && result.ok && ctx.user) {
    const actionName = path.toUpperCase().replace(/\./g, "_");
    const entityType = path.split(".")[0]?.toUpperCase();

    // Extract ID safely from the unknown input
    const entityId = extractEntityId(rawInput);

    // Ensure details is a valid Object for JSON storage, or undefined
    const details =
      typeof rawInput === "object" && rawInput !== null
        ? (rawInput as Prisma.InputJsonValue)
        : undefined;

    try {
      await ctx.db.activityLog.create({
        data: {
          userId: ctx.user.id,
          action: actionName,
          entityType: entityType,
          entityId: entityId,
          details: details ?? Prisma.DbNull,
        },
      });
    } catch (e) {
      console.error(`[ActivityLog] Auto-log failed for ${path}`, e);
    }
  }

  return result;
});

/**
 * Public procedure
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected procedure
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        user: ctx.user,
      },
    });
  })
  .use(activityLoggerMiddleware); // Attached after auth so ctx.user is safe

/**
 * Admin procedure
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const allowedRoles = ["ADMIN", "SUPPORT", "FINANCE"];
  if (!allowedRoles.includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({
    ctx: {
      user: ctx.user,
    },
  });
});
