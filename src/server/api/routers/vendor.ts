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
          location: z
            .object({
              lat: z.number(),
              lon: z.number(),
              radius: z.number(),
            })
            .optional(),
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

        // Convert radius from meters to approximate degrees for ST_DWithin on geometry.
        // This is a simplification and is less accurate than using geography, but more resilient.
        // 1 degree of latitude is approx. 111.1km.
        const radiusInDegrees = radius / 111111.0;

        const vendorsInRadius = await ctx.db.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM "VendorProfile"
            WHERE "location" IS NOT NULL
              AND "location"->>'lat' IS NOT NULL
              AND "location"->>'lon' IS NOT NULL
              AND ST_DWithin(
                ST_MakePoint(CAST("location"->>'lon' AS DOUBLE PRECISION), CAST("location"->>'lat' AS DOUBLE PRECISION)),
                ST_MakePoint(CAST(${lon} AS NUMERIC), CAST(${lat} AS NUMERIC)),
                ${radiusInDegrees}
            )
        `;

        const vendorIds = vendorsInRadius.map((v) => v.id);

        if (vendorIds.length === 0) {
          return { vendors: [], totalCount: 0 };
        }

        whereClause.id = {
          in: vendorIds,
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

  searchVendors: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        serviceIds: z.array(z.number()).optional(),
        location: z
          .object({
            lat: z.number(),
            lon: z.number(),
            radius: z.number(),
          })
          .optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, serviceIds, location, limit, offset } = input;

      const whereClause: Prisma.VendorProfileWhereInput = {
        // kycStatus: "APPROVED",
      };

      if (serviceIds && serviceIds.length > 0) {
        whereClause.services = {
          some: {
            serviceId: {
              in: serviceIds,
            },
          },
        };
      }

      if (query) {
        whereClause.OR = [
          {
            user: {
              username: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
          {
            companyName: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
        ];
      }

      if (location) {
        const { lat, lon, radius } = location;
        const radiusInDegrees = radius / 111111.0;

        const vendorsInRadius = await ctx.db.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM "VendorProfile"
            WHERE "location" IS NOT NULL
              AND "location"->>'lat' IS NOT NULL
              AND "location"->>'lon' IS NOT NULL
              AND ST_DWithin(
                ST_MakePoint(CAST("location"->>'lon' AS DOUBLE PRECISION), CAST("location"->>'lat' AS DOUBLE PRECISION)),
                ST_MakePoint(CAST(${lon} AS NUMERIC), CAST(${lat} AS NUMERIC)),
                ${radiusInDegrees}
            )
        `;

        const vendorIds = vendorsInRadius.map((v) => v.id);

        if (vendorIds.length === 0) {
          return { vendors: [], totalCount: 0 };
        }

        whereClause.id = {
          in: vendorIds,
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
              id: true,
              username: true,
            },
          },
          services: {
            include: {
              service: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          rating: "desc",
        },
      });

      return {
        vendors: vendors.map((vendor) => ({
          ...vendor,
          // simplify services for the client
          username: vendor.user.username,
          services: vendor.services.map((s) => s.service.name),
        })),
        totalCount,
      };
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
