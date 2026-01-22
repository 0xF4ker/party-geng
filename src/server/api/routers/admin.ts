import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { TransactionType, TransactionStatus } from "@prisma/client";

export const adminRouter = createTRPCRouter({
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    const { role } = ctx.user;

    // --- SHARED STATS (Base) ---
    const stats = {
      role,
      userCount: undefined as number | undefined,
      vendorCount: undefined as number | undefined,
      orderCount: undefined as number | undefined,
      pendingKybCount: undefined as number | undefined,
      totalRevenue: undefined as number | undefined,
      totalVolume: undefined as number | undefined, // GMV
      pendingPayoutsVolume: undefined as number | undefined,
      pendingPayoutsCount: undefined as number | undefined,
    };

    // Calculate GMV (Gross Merchandise Value)
    // Definition: Total money SPENT by users (Transfers + Gifts)
    // We filter for amount < 0 to count the "Debit" side of the transaction
    const calculateGMV = async () => {
      const agg = await ctx.db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: TransactionStatus.COMPLETED,
          amount: { lt: 0 }, // Only count money LEAVING wallets (Spending)
          type: { in: [TransactionType.TRANSFER, TransactionType.GIFT] }, // Services + Wishlists
        },
      });
      return Math.abs(agg._sum.amount ?? 0);
    };

    // Calculate Revenue (Platform Profit)
    // Definition: Service fees collected
    const calculateRevenue = async () => {
      const agg = await ctx.db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: TransactionStatus.COMPLETED,
          type: TransactionType.SERVICE_FEE,
        },
      });
      return Math.abs(agg._sum.amount ?? 0);
    };

    // --- 1. ADMIN (God View) ---
    if (role === "ADMIN") {
      const [
        users,
        vendors,
        orders,
        pendingKyb,
        revenue,
        gmv,
        pendingPayoutsAgg,
        pendingPayoutsCnt,
      ] = await Promise.all([
        ctx.db.user.count(),
        ctx.db.vendorProfile.count(),
        ctx.db.order.count({ where: { status: "ACTIVE" } }),
        ctx.db.vendorProfile.count({ where: { kybStatus: "IN_REVIEW" } }),
        calculateRevenue(),
        calculateGMV(),
        ctx.db.transaction.aggregate({
          _sum: { amount: true },
          where: {
            type: TransactionType.PAYOUT,
            status: TransactionStatus.PENDING,
          },
        }),
        ctx.db.transaction.count({
          where: {
            type: TransactionType.PAYOUT,
            status: TransactionStatus.PENDING,
          },
        }),
      ]);

      stats.userCount = users;
      stats.vendorCount = vendors;
      stats.orderCount = orders;
      stats.pendingKybCount = pendingKyb;
      stats.totalRevenue = revenue;
      stats.totalVolume = gmv; // This is now Transfers + Gifts
      stats.pendingPayoutsVolume = Math.abs(pendingPayoutsAgg._sum.amount ?? 0);
      stats.pendingPayoutsCount = pendingPayoutsCnt;
    }

    // --- 2. SUPPORT (Operations View) ---
    else if (role === "SUPPORT") {
      const [users, vendors, pendingKyb, disputeOrders] = await Promise.all([
        ctx.db.user.count(),
        ctx.db.vendorProfile.count(),
        ctx.db.vendorProfile.count({ where: { kybStatus: "IN_REVIEW" } }),
        ctx.db.order.count({ where: { status: "IN_DISPUTE" } }),
      ]);

      stats.userCount = users;
      stats.vendorCount = vendors;
      stats.pendingKybCount = pendingKyb;
      stats.orderCount = disputeOrders;
    }

    // --- 3. FINANCE (Money View) ---
    else if (role === "FINANCE") {
      const [revenue, gmv, pendingPayoutsAgg, pendingPayoutsCnt] =
        await Promise.all([
          calculateRevenue(),
          calculateGMV(),
          ctx.db.transaction.aggregate({
            _sum: { amount: true },
            where: {
              type: TransactionType.PAYOUT,
              status: TransactionStatus.PENDING,
            },
          }),
          ctx.db.transaction.count({
            where: {
              type: TransactionType.PAYOUT,
              status: TransactionStatus.PENDING,
            },
          }),
        ]);

      stats.totalRevenue = revenue;
      stats.totalVolume = gmv;
      stats.pendingPayoutsVolume = Math.abs(pendingPayoutsAgg._sum.amount ?? 0);
      stats.pendingPayoutsCount = pendingPayoutsCnt;
    }

    return stats;
  }),

  // ... (keep rest of router: getPendingKyc, approveKyc)
  getPendingKyc: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.vendorProfile.findMany({
        where: { kybStatus: "IN_REVIEW" },
        take: input.limit,
        skip: input.offset,
        include: { user: { select: { email: true, username: true } } },
      });
    }),

  approveKyc: adminProcedure
    .input(z.object({ vendorProfileId: z.string(), approved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.vendorProfile.update({
        where: { id: input.vendorProfileId },
        data: { kybStatus: input.approved ? "APPROVED" : "REJECTED" },
      });
    }),
});
