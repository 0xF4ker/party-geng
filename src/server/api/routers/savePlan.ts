import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  SavePlanFrequency,
  TransactionType,
  SavePlanStatus,
  NotificationType,
} from "@prisma/client";

export const savePlanRouter = createTRPCRouter({
  // Create a new savings plan
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        targetAmount: z.number().min(1, "Target amount must be greater than 0"),
        frequency: z.nativeEnum(SavePlanFrequency),
        autoSaveAmount: z.number().optional(), // Required if frequency is not MANUAL
        targetDate: z.date(),
        initialDeposit: z.number().optional(), // Optional initial deposit
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        title,
        description,
        targetAmount,
        frequency,
        autoSaveAmount,
        targetDate,
        initialDeposit,
      } = input;
      const userId = ctx.user.id;

      if (frequency !== "MANUAL" && (!autoSaveAmount || autoSaveAmount <= 0)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Auto-save amount is required for automated plans.",
        });
      }

      if (targetDate <= new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Target date must be in the future.",
        });
      }

      return ctx.db.$transaction(async (prisma) => {
        // 1. Create the plan
        const plan = await prisma.savePlan.create({
          data: {
            userId,
            title,
            description,
            targetAmount,
            frequency,
            autoSaveAmount,
            targetDate,
            currentAmount: 0,
            status: "ACTIVE",
            // Set next deduction date if automated
            nextDeductionDate: frequency !== "MANUAL" ? new Date() : null, // Logic for next date would be more complex in real app (cron jobs)
          },
        });

        // 2. Handle initial deposit if provided
        if (initialDeposit && initialDeposit > 0) {
          const wallet = await prisma.wallet.findUnique({
            where: { userId },
          });

          if (!wallet || wallet.availableBalance < initialDeposit) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Insufficient funds for initial deposit.",
            });
          }

          // Debit wallet
          await prisma.wallet.update({
            where: { userId },
            data: { availableBalance: { decrement: initialDeposit } },
          });

          // Credit plan
          await prisma.savePlan.update({
            where: { id: plan.id },
            data: { currentAmount: { increment: initialDeposit } },
          });

          // Create transaction
          await prisma.transaction.create({
            data: {
              walletId: wallet.id,
              type: TransactionType.ISAVE_DEPOSIT,
              amount: -initialDeposit,
              status: "COMPLETED",
              savePlanId: plan.id,
              description: `Initial deposit to iSave: ${title}`,
            },
          });
        }

        return plan;
      });
    }),

  // Get all plans for the user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.savePlan.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get a single plan details
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const plan = await ctx.db.savePlan.findUnique({
        where: { id: input.id },
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 10, // Limit recent history
          },
        },
      });

      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });
      }

      if (plan.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized." });
      }

      return plan;
    }),

  // Deposit funds into a plan
  deposit: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        amount: z.number().min(100, "Minimum deposit is 100"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { planId, amount } = input;
      const userId = ctx.user.id;

      const plan = await ctx.db.savePlan.findUnique({
        where: { id: planId },
      });

      if (plan?.userId !== userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });
      }

      if (plan.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot deposit into an inactive plan.",
        });
      }

      const wallet = await ctx.db.wallet.findUnique({
        where: { userId },
      });

      if (!wallet || wallet.availableBalance < amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient wallet funds.",
        });
      }

      return ctx.db.$transaction(async (prisma) => {
        // Debit wallet
        await prisma.wallet.update({
          where: { userId },
          data: { availableBalance: { decrement: amount } },
        });

        // Credit plan
        const updatedPlan = await prisma.savePlan.update({
          where: { id: planId },
          data: { currentAmount: { increment: amount } },
        });

        // Create transaction
        await prisma.transaction.create({
          data: {
            walletId: wallet.id,
            type: TransactionType.ISAVE_DEPOSIT,
            amount: -amount,
            status: "COMPLETED",
            savePlanId: planId,
            description: `Deposit to iSave: ${plan.title}`,
          },
        });

        // Check if target reached (optional notification)
        if (updatedPlan.currentAmount >= updatedPlan.targetAmount) {
          // Could send a notification or mark as COMPLETED automatically if desired
          // For now, we just notify
          await prisma.notification.create({
            data: {
              userId,
              type: NotificationType.ORDER_UPDATE, // Using generic update type
              message: `Congratulations! You've reached your target for "${plan.title}"!`,
              link: `/isave/${plan.id}`,
            },
          });
        }

        return updatedPlan;
      });
    }),

  // Break a plan (Withdraw funds early/delete)
  breakPlan: protectedProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { planId } = input;
      const userId = ctx.user.id;

      const plan = await ctx.db.savePlan.findUnique({
        where: { id: planId },
      });

      if (plan?.userId !== userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });
      }

      if (plan.currentAmount === 0) {
        // Just delete if empty
        await ctx.db.savePlan.delete({ where: { id: planId } });
        return { success: true, message: "Plan deleted." };
      }

      // If funds exist, return to wallet
      const wallet = await ctx.db.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Wallet not found.",
        });
      }

      return ctx.db.$transaction(async (prisma) => {
        // Credit wallet
        await prisma.wallet.update({
          where: { userId },
          data: { availableBalance: { increment: plan.currentAmount } },
        });

        // Log transaction
        await prisma.transaction.create({
          data: {
            walletId: wallet.id,
            type: TransactionType.ISAVE_WITHDRAWAL,
            amount: plan.currentAmount,
            status: "COMPLETED",
            savePlanId: planId, // Keep reference? Or nullable if we delete.
            // Prisma might complain if we delete the plan and it's referenced.
            // We should probably set status to CANCELLED instead of deleting.
            description: `Broken iSave plan: ${plan.title}`,
          },
        });

        // Mark plan as CANCELLED (Soft delete preferred for financial records)
        // OR delete if user wants it gone.
        // Based on "Deleting the plan will return all saved funds", let's soft delete or just update status.
        // Updating status preserves history.
        await prisma.savePlan.update({
          where: { id: planId },
          data: { status: SavePlanStatus.CANCELLED, currentAmount: 0 },
        });

        return { success: true, message: "Plan broken and funds returned." };
      });
    }),

  // Withdraw completed plan
  withdrawCompletedPlan: protectedProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { planId } = input;
      const userId = ctx.user.id;

      const plan = await ctx.db.savePlan.findUnique({
        where: { id: planId },
      });

      if (plan?.userId !== userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found." });
      }

      if (plan.targetDate > new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot withdraw active plan before target date. Use 'Break Plan' instead.",
        });
      }

      if (plan.currentAmount === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No funds to withdraw.",
        });
      }

      const wallet = await ctx.db.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return ctx.db.$transaction(async (prisma) => {
        await prisma.wallet.update({
          where: { userId },
          data: { availableBalance: { increment: plan.currentAmount } },
        });

        await prisma.transaction.create({
          data: {
            walletId: wallet.id,
            type: TransactionType.ISAVE_WITHDRAWAL,
            amount: plan.currentAmount,
            status: "COMPLETED",
            savePlanId: planId,
            description: `Withdrew completed iSave plan: ${plan.title}`,
          },
        });

        await prisma.savePlan.update({
          where: { id: planId },
          data: { status: SavePlanStatus.COMPLETED, currentAmount: 0 },
        });

        return { success: true };
      });
    }),
});
