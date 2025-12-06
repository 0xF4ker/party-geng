import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

export const vendorRouter = createTRPCRouter({
  // Get current vendor's profile
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.vendorProfile.findUnique({
      where: { userId: ctx.user.id },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }),

  // Get vendor by username (public)
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
        include: {
          vendorProfile: {
            include: {
              services: {
                include: {
                  service: true,
                },
              },
            },
          },
        },
      });

      if (!user || !user.vendorProfile) {
        throw new Error("Vendor not found");
      }

      return {
        ...user.vendorProfile,
        username: user.username,
      };
    }),

  // Get vendors by service ID
  getVendorsByService: publicProcedure
    .input(
      z.object({
        serviceId: z.number(),
        filters: z.object({
          minRating: z.number().optional(),
          location: z.object({
            lat: z.number(),
            lon: z.number(),
            radius: z.number(),
          }).optional(),
        }),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { serviceId, filters, limit, offset } = input;

      const whereClause: Prisma.VendorProfileWhereInput = {
        services: {
          some: {
            serviceId: serviceId,
          },
        },
        // kycStatus: "APPROVED",
      };

      if (filters.minRating) {
        whereClause.rating = {
          gte: filters.minRating,
        };
      }
      
      if (filters.location) {
        const { lat, lon, radius } = filters.location;
        
        // This is a raw query. It assumes PostGIS is enabled.
        const vendorsInRadius = await ctx.db.$queryRaw<Array<{id: string}>>`
            SELECT id FROM "VendorProfile"
            WHERE "location" IS NOT NULL AND
            ST_DWithin(
                ST_SetSRID(ST_MakePoint(
                    CAST("location"->>'lon' AS DOUBLE PRECISION),
                    CAST("location"->>'lat' AS DOUBLE PRECISION)
                ), 4326)::geography,
                ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
                ${radius}
            )
        `;
        
        const vendorIds = vendorsInRadius.map(v => v.id);

        if (vendorIds.length === 0) {
            return { vendors: [], totalCount: 0 };
        }

        whereClause.id = {
            in: vendorIds
        };
      }

      const totalCount = await ctx.db.vendorProfile.count({
        where: whereClause,
      });

      const vendors = await ctx.db.vendorProfile.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {
          rating: "desc",
        },
      });

      return {
        vendors,
        totalCount,
      };
    }),

  // Find vendors by multiple service IDs
  findVendors: publicProcedure
    .input(
      z.object({
        serviceIds: z.array(z.number()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.serviceIds || input.serviceIds.length === 0) {
        // If no serviceIds are provided, return all approved vendors
        const allVendors = await ctx.db.vendorProfile.findMany({
          where: {
            kycStatus: "APPROVED",
          },
          include: {
            user: {
              select: {
                username: true,
              },
            },
            services: {
              include: {
                service: true,
              },
            },
          },
        });
        return allVendors.map((vendor) => ({
          ...vendor,
          username: vendor.user.username,
        }));
      }

      // Find vendor profiles that offer ALL specified services
      const vendors = await ctx.db.vendorProfile.findMany({
        where: {
          kycStatus: "APPROVED",
          services: {
            every: {
              serviceId: {
                in: input.serviceIds,
              },
            },
          },
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
          services: {
            include: {
              service: true,
            },
          },
        },
      });

      return vendors.map((vendor) => ({
        ...vendor,
        username: vendor.user.username,
      }));
    }),

  submitKyc: protectedProcedure
    .input(
      z.object({
        fullName: z.string(),
        cacNumber: z.string(),
        businessAddress: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.vendorProfile.update({
        where: { userId: ctx.user.id },
        data: {
          fullName: input.fullName,
          cacNumber: input.cacNumber,
          businessAddress: input.businessAddress,
          kycStatus: "IN_REVIEW",
        },
      });
    }),
});
