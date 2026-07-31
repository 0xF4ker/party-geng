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
    objectives?: string[];
    line_of_business?: string[];
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
      console.log("KYB Config Debug:", {
        baseUrl,
        keyLength: apiKey.length,
        keyPrefix: apiKey.slice(0, 10),
        keySuffix: apiKey.slice(-10),
      });
      const cleanBaseUrl = baseUrl.replace(/\/$/, "");
      const url = `${cleanBaseUrl}/api/vas/validation/company/rc`;
      const cleanRc = rcNumber.trim().replace(/^(RC|BN|IT|LLP|LP)\s*-*\s*/i, "");

      try {
        const response = await fetch(
          url,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "X_API_KEY": apiKey,
            },
            body: JSON.stringify({
              rc_number: cleanRc,
            }),
          },
        );

        const responseStatus = response.status;
        const responseText = await response.text();

        if (!response.ok) {
          throw new Error(`Registry API responded with status ${responseStatus}: ${responseText.slice(0, 150)}`);
        }

        let result: ExternalKybResponse;
        try {
          result = JSON.parse(responseText) as ExternalKybResponse;
        } catch (e) {
          throw new Error(`Registry API returned invalid JSON: ${responseText.slice(0, 150)}`);
        }

        if (!result.success) {
          throw new Error(result.message || "External API verification failed");
        }

        if (result.data) {
          // Map line_of_business to objectives so the frontend displays it seamlessly
          if (result.data.line_of_business && !result.data.objectives) {
            result.data.objectives = result.data.line_of_business;
          }
        }

        return result.data;
      } catch (error) {
        console.error("KYB API Error:", error);
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: error instanceof Error ? error.message : "Failed to connect to registry API",
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
