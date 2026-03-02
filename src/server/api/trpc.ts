import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
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
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {}
        },
      },
    },
  );

  const authHeader = opts.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  let authUser = null;

  if (token) {
    const { data } = await supabase.auth.getUser(token);
    authUser = data.user;
  } else {
    const { data } = await supabase.auth.getUser();
    authUser = data.user;
  }

  const profile = authUser
    ? await db.user.findUnique({ where: { id: authUser.id } })
    : null;

  return {
    db,
    supabase,
    user: profile,
    authUser: authUser,
    auditFlags: { disabled: false },
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
/**
 * Helper to safely extract an ID from unknown input.
 * Checks for common ID fields (id, orderId, etc.)
 */
function extractEntityId(input: unknown): string | undefined {
  if (!input || typeof input !== "object" || input === null) return undefined;
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
  const { ctx, next, path, type } = opts;
  const result = await next();
  if (ctx.auditFlags.disabled) {
    return result;
  }
  const rawInput = (opts as { rawInput?: unknown }).rawInput;
  if (type === "mutation" && result.ok && ctx.user) {
    const actionName = path.toUpperCase().replace(/\./g, "_");
    const entityType = path.split(".")[0]?.toUpperCase();
    const entityId = extractEntityId(rawInput);
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
export const onboardingProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.authUser) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not logged in to Supabase",
      });
    }
    return next({
      ctx: {
        authUser: ctx.authUser,
        user: ctx.user,
      },
    });
  });
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
  .use(activityLoggerMiddleware);
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
