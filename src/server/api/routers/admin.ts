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
      userCount: 0,
      vendorCount: 0,
      orderCount: 0,
      pendingKybCount: 0,
      totalRevenue: 0,
      totalVolume: 0, // GMV
      pendingPayoutsVolume: 0,
      pendingPayoutsCount: 0,
    };

    // Calculate GMV (Gross Merchandise Value)
    // Total money moving through the system (Transfers + Gifts)
    const calculateGMV = async () => {
      const agg = await ctx.db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: TransactionStatus.COMPLETED,
          amount: { lt: 0 }, // Spending (Debits)
          type: { in: [TransactionType.TRANSFER, TransactionType.GIFT] },
        },
      });
      return Math.abs(agg._sum.amount ?? 0);
    };

    // Calculate Revenue (Platform Profit)
    // We sum the Credits (positive amounts) going into the System Wallet
    // OR we sum the Debits (negative amounts) labeled as Fees from user wallets.
    // Let's rely on the Type label for simplicity.
    const calculateRevenue = async () => {
      const agg = await ctx.db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: TransactionStatus.COMPLETED,
          // We only count the DEBIT side (negative) from users as revenue generated
          amount: { lt: 0 },
          type: {
            in: [TransactionType.SUBSCRIPTION_FEE, TransactionType.SERVICE_FEE],
          },
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
      stats.totalVolume = gmv;
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

  getGlobalSettings: adminProcedure.query(async ({ ctx }) => {
    // Upsert ensures we always return a valid object, creating default if missing
    return ctx.db.globalSettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        // Defaults are handled by Prisma schema
      },
    });
  }),

  // 2. UPDATE SETTINGS
  updateGlobalSettings: adminProcedure
    .input(
      z.object({
        serviceFeePercent: z.number().min(0).max(100),
        minWithdrawalAmount: z.number().min(0),
        payoutDelayDays: z.number().min(0),
        maintenanceMode: z.boolean(),
        allowNewRegistrations: z.boolean(),
        isKybEnabled: z.boolean(),
        supportEmail: z.string().email(),
        supportPhone: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.globalSettings.update({
        where: { id: 1 },
        data: input,
      });
    }),
});
