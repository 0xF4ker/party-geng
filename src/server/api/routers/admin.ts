import { z } from "zod";
import {
  adminProcedure,
  createTRPCRouter,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const adminRouter = createTRPCRouter({
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    const { role } = ctx.user;

    // Initialize stats
    let userCount: number | undefined;
    let vendorCount: number | undefined;
    let orderCount: number | undefined;
    let pendingKycCount: number | undefined;
    let totalRevenue: number | undefined;
    let totalPayouts: number | undefined;

    // --- ADMIN: Gets Everything ---
    if (role === "ADMIN") {
      userCount = await ctx.db.user.count();
      vendorCount = await ctx.db.vendorProfile.count();
      orderCount = await ctx.db.order.count();
      
      pendingKycCount = await ctx.db.vendorProfile.count({
        where: { kycStatus: "IN_REVIEW" },
      });

      // Simple revenue aggregation (completed orders)
      const revenueAgg = await ctx.db.order.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      });
      totalRevenue = revenueAgg._sum.amount ?? 0;

      // Simple payout aggregation
      const payoutAgg = await ctx.db.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "PAYOUT", status: "COMPLETED" },
      });
      totalPayouts = payoutAgg._sum.amount ?? 0;
    }

    // --- SUPPORT: Users & KYC ---
    else if (role === "SUPPORT") {
      userCount = await ctx.db.user.count();
      vendorCount = await ctx.db.vendorProfile.count();
      pendingKycCount = await ctx.db.vendorProfile.count({
        where: { kycStatus: "IN_REVIEW" },
      });
    }

    // --- FINANCE: Money & Orders ---
    else if (role === "FINANCE") {
      orderCount = await ctx.db.order.count();
      
      const revenueAgg = await ctx.db.order.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      });
      totalRevenue = revenueAgg._sum.amount ?? 0;

      const payoutAgg = await ctx.db.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "PAYOUT", status: "COMPLETED" },
      });
      totalPayouts = payoutAgg._sum.amount ?? 0;
    }

    return {
      role,
      userCount,
      vendorCount,
      orderCount,
      pendingKycCount,
      totalRevenue,
      totalPayouts,
    };
  }),

  getPendingKyc: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const vendors = await ctx.db.vendorProfile.findMany({
        where: { kycStatus: "IN_REVIEW" },
        take: input.limit,
        skip: input.offset,
        include: {
          user: {
            select: {
              email: true,
              username: true,
            },
          },
        },
      });
      return vendors;
    }),

  approveKyc: adminProcedure
    .input(z.object({ vendorProfileId: z.string(), approved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const vendor = await ctx.db.vendorProfile.findUnique({
        where: { id: input.vendorProfileId },
      });

      if (!vendor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vendor profile not found",
        });
      }

      return ctx.db.vendorProfile.update({
        where: { id: input.vendorProfileId },
        data: {
          kycStatus: input.approved ? "APPROVED" : "REJECTED",
        },
      });
    }),
});
