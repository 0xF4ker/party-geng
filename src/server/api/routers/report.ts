import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { logActivity } from "../services/activityLogger";

export const reportRouter = createTRPCRouter({
  // --- USER ACTIONS ---

  create: protectedProcedure
    .input(
      z.object({
        reason: z.enum([
          "EXPLICIT_CONTENT",
          "ILLEGAL_ACTIVITY",
          "HARASSMENT",
          "HATE_SPEECH_OR_VIOLENCE",
          "SPAM",
          "OTHER",
        ]),
        details: z.string().optional(),
        targetUserId: z.string().optional(),
        targetPostId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate: Must report SOMETHING
      if (!input.targetUserId && !input.targetPostId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You must specify a user or a post to report.",
        });
      }

      return ctx.db.report.create({
        data: {
          reporterId: ctx.user.id,
          reason: input.reason,
          details: input.details,
          targetUserId: input.targetUserId,
          targetPostId: input.targetPostId,
        },
      });
    }),

  // --- ADMIN ACTIONS ---

  getAll: adminProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "RESOLVED", "DISMISSED"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const reports = await ctx.db.report.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          status: input.status,
        },
        orderBy: { createdAt: "desc" },
        include: {
          reporter: {
            select: { username: true, email: true },
          },
          targetUser: {
            select: {
              id: true,
              username: true,
              email: true,
              status: true,
              clientProfile: { select: { avatarUrl: true } },
              vendorProfile: { select: { avatarUrl: true } },
            },
          },
          targetPost: {
            include: {
              assets: { take: 1 }, // Show first image in admin preview
              author: { select: { username: true } },
            },
          },
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (reports.length > input.limit) {
        const nextItem = reports.pop();
        nextCursor = nextItem!.id;
      }

      return { reports, nextCursor };
    }),

  resolveReport: adminProcedure
    .input(
      z.object({
        reportId: z.string(),
        action: z.enum([
          "DISMISS",
          "BAN_USER",
          "DELETE_POST",
          "DELETE_POST_AND_BAN",
        ]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.db.report.findUnique({
        where: { id: input.reportId },
        include: { targetPost: true },
      });

      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      }

      // Perform Action
      if (input.action === "BAN_USER") {
        const userIdToBan = report.targetUserId || report.targetPost?.authorId;
        if (userIdToBan) {
          await ctx.db.user.update({
            where: { id: userIdToBan },
            data: {
              status: "BANNED",
              suspensionReason: `Report #${report.id}: ${input.notes}`,
            },
          });
        }
      } else if (input.action === "DELETE_POST") {
        if (report.targetPostId) {
          await ctx.db.post.delete({ where: { id: report.targetPostId } });
        }
      } else if (input.action === "DELETE_POST_AND_BAN") {
        if (report.targetPostId) {
          const post = await ctx.db.post.delete({
            where: { id: report.targetPostId },
          });
          await ctx.db.user.update({
            where: { id: post.authorId },
            data: {
              status: "BANNED",
              suspensionReason: `Report #${report.id}: ${input.notes}`,
            },
          });
        }
      }

      // Update Report Status
      const finalStatus = input.action === "DISMISS" ? "DISMISSED" : "RESOLVED";

      const updatedReport = await ctx.db.report.update({
        where: { id: input.reportId },
        data: {
          status: finalStatus,
          resolvedByAdminId: ctx.user.id,
          resolvedAt: new Date(),
          resolutionNotes: input.notes,
        },
      });

      // Log Admin Activity
      await logActivity({
        ctx,
        action: "REPORT_RESOLVE",
        entityType: "REPORT",
        entityId: report.id,
        details: { action: input.action, notes: input.notes },
      });

      return updatedReport;
    }),
});
