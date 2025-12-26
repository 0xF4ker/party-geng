import { Prisma, type PrismaClient } from "@prisma/client";

type LoggingContext = {
  db: PrismaClient;
  user: { id: string } | null;
};

interface LogActivityParams {
  ctx: LoggingContext;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Prisma.InputJsonValue;
}

export const logActivity = async ({
  ctx,
  action,
  entityType,
  entityId,
  details,
}: LogActivityParams) => {
  if (!ctx.user) return;

  try {
    await ctx.db.activityLog.create({
      data: {
        userId: ctx.user.id,
        action,
        entityType,
        entityId,
        // Prisma.DbNull is a value, so we needed the import fix above
        details: details ?? Prisma.DbNull,
      },
    });
  } catch (error) {
    console.error(`[ActivityLog] Failed to log action ${action}:`, error);
  }
};
