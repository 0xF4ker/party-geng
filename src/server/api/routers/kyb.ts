import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";

export const kybRouter = createTRPCRouter({
  // 1. Fetch KYB Requests
  getRequests: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        search: z.string().optional(),
        status: z
          .enum(["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Security Check: Ensure user is Admin (Uncomment when ready)
      /* if (ctx.session.user.role !== "ADMIN") {
         throw new TRPCError({ code: "FORBIDDEN" });
      } 
      */

      // --- Strict Type Construction ---
      // We build the vendor profile filter first
      const vendorProfileFilter: Prisma.VendorProfileWhereInput = {};

      // 1. Status Filter
      if (input.status) {
        vendorProfileFilter.kybStatus = input.status;
      } else {
        // Default view: Everything except PENDING
        vendorProfileFilter.kybStatus = {
          in: ["IN_REVIEW", "APPROVED", "REJECTED"],
        };
      }

      // 2. Search Filter (Company Name OR Reg Number)
      if (input.search) {
        vendorProfileFilter.OR = [
          { companyName: { contains: input.search, mode: "insensitive" } },
          { regNumber: { contains: input.search, mode: "insensitive" } },
        ];
      }

      // 3. Assemble User Where Input
      const where: Prisma.UserWhereInput = {
        role: "VENDOR",
        vendorProfile: {
          isNot: null, // Ensure they actually have a profile
          is: vendorProfileFilter, // Apply the specific filters defined above
        },
      };

      return ctx.db.user.findMany({
        take: input.limit,
        where,
        include: {
          vendorProfile: true,
        },
        orderBy: {
          vendorProfile: {
            updatedAt: "desc",
          },
        },
      });
    }),

  // 2. Process Decision
  processDecision: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        decision: z.enum(["APPROVED", "REJECTED"]),
        rejectionReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Security Check
      // if (ctx.session.user.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });

      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: { vendorProfile: true },
      });

      if (!user || !user.vendorProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vendor profile not found",
        });
      }

      return ctx.db.vendorProfile.update({
        where: { id: user.vendorProfile.id },
        data: {
          kybStatus: input.decision,
          // If you add a rejectionReason column later, map it here:
          // rejectionReason: input.decision === "REJECTED" ? input.rejectionReason : null,
        },
      });
    }),
});
