import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";
interface ExternalKybResponse {
  statusCode: number;
  status: string;
  message: string;
  success: boolean;
  count: number;
  data?: {
    rc_number: string;
    entity_name: string;
    entity_type: string;
    registration_date: string;
    objectives: string[];
  };
}
export const kybRouter = createTRPCRouter({
  getRequests: adminProcedure
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
      const vendorProfileFilter: Prisma.VendorProfileWhereInput = {};
      if (input.status) {
        vendorProfileFilter.kybStatus = input.status;
      } else {
        vendorProfileFilter.kybStatus = {
          in: ["IN_REVIEW", "APPROVED", "REJECTED"],
        };
      }
      if (input.search) {
        vendorProfileFilter.OR = [
          { companyName: { contains: input.search, mode: "insensitive" } },
          { regNumber: { contains: input.search, mode: "insensitive" } },
        ];
      }
      const where: Prisma.UserWhereInput = {
        role: "VENDOR",
        vendorProfile: {
          isNot: null,
          is: vendorProfileFilter,
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
  verifyRegistry: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { vendorProfile: true },
      });
      if (!user?.vendorProfile?.regNumber) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Vendor does not have a registration number on file.",
        });
      }
      const rcNumber = user.vendorProfile.regNumber;
      const baseUrl = process.env.KYB_BASE_URL;
      const apiKey = process.env.KYB_API_KEY;
      if (!baseUrl || !apiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server missing KYB integration credentials.",
        });
      }
      try {
        const response = await fetch(
          `${baseUrl}/api/vas/validation/secure/company`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              X_API_KEY: apiKey,
            },
            body: JSON.stringify({
              vrc: rcNumber,
            }),
          },
        );
        const result = (await response.json()) as ExternalKybResponse;
        if (!response.ok || !result.success) {
          throw new Error(result.message || "External API verification failed");
        }
        return result.data;
      } catch (error) {
        console.error("KYB API Error:", error);
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message:
            error instanceof Error
              ? error.message
              : "Failed to connect to registry API",
        });
      }
    }),
  processDecision: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        decision: z.enum(["APPROVED", "REJECTED"]),
        rejectionReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
        },
      });
    }),
});
