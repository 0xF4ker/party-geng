import { z } from "zod";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "@/server/api/trpc";

export const activityLogRouter = createTRPCRouter({
  getAllLogs: adminProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        entityType: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, offset, ...filters } = input;

      const whereClause = {
        userId: filters.userId,
        entityType: filters.entityType,
      };

      const [logs, totalCount] = await Promise.all([
        ctx.db.activityLog.findMany({
          where: whereClause,
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { username: true, email: true, role: true } },
          },
        }),
        ctx.db.activityLog.count({ where: whereClause }),
      ]);

      return { logs, totalCount };
    }),
  // For Users: View their own security history (Logins, Payouts)
  getMyHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.activityLog.findMany({
        where: { userId: ctx.user.id },
        take: input.limit,
        orderBy: { createdAt: "desc" },
      });
    }),
});
