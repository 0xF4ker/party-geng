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
      console.log("KYB Config Debug:", {
        baseUrl,
        keyLength: apiKey.length,
        keyPrefix: apiKey.slice(0, 10),
        keySuffix: apiKey.slice(-10),
      });
      const cleanBaseUrl = baseUrl.replace(/\/$/, "");
      const url = `${cleanBaseUrl}/api/vas/validation/company`;

      const cleanRc = rcNumber.trim().replace(/^(RC|BN|IT|LLP|LP)\s*-*\s*/i, "");
      
      let guessedType = "PRIVATE_COMPANY_SHARES";
      if (/BN/i.test(rcNumber)) {
        guessedType = "BUSINESS_NAME";
      } else if (/IT/i.test(rcNumber) || /CAC/i.test(rcNumber)) {
        guessedType = "INCORPORATED_TRUSTEE";
      }

      const entityTypesToTry = [
        guessedType,
        "PRIVATE_COMPANY_SHARES",
        "BUSINESS_NAME",
        "INCORPORATED_TRUSTEE"
      ].filter((v, i, a) => a.indexOf(v) === i);

      let lastError: Error | null = null;
      let lastResponseText = "";
      let lastResponseStatus = 200;

      for (const entityType of entityTypesToTry) {
        try {
          const response = await fetch(
            url,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "x-api-key": apiKey,
                "X-API-KEY": apiKey,
                X_API_KEY: apiKey,
              },
              body: JSON.stringify({
                rc_number: cleanRc,
                entity_type: entityType,
              }),
            },
          );

          lastResponseStatus = response.status;
          lastResponseText = await response.text();

          if (!response.ok) {
            lastError = new Error(`Registry API responded with status ${response.status}: ${lastResponseText.slice(0, 150)}`);
            continue; // Try next type
          }

          let result: ExternalKybResponse;
          try {
            result = JSON.parse(lastResponseText) as ExternalKybResponse;
          } catch (e) {
            lastError = new Error(`Registry API returned invalid JSON: ${lastResponseText.slice(0, 150)}`);
            continue;
          }

          if (!result.success) {
            lastError = new Error(result.message || "External API verification failed");
            continue;
          }

          return result.data;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
        }
      }

      console.error("KYB API Error after trying all entity types:", lastError);
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: lastError
          ? lastError.message
          : `Failed with status ${lastResponseStatus}: ${lastResponseText.slice(0, 150) || "Empty response"}`,
      });
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
