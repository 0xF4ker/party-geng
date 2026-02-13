import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "@/server/db";

// --- 1. CACHED QUERIES ---

// Cache: Vendor Profile by Username (Public View)
// This is the "Profile Page" query - critical to cache.
const getCachedVendorByUsername = unstable_cache(
  async (username: string) => {
    const user = await db.user.findUnique({
      where: { username },
      include: {
        vendorProfile: {
          where: { kybStatus: "APPROVED" }, // Only show if approved
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
      return null;
    }

    // Return a flattened object to match the procedure's expected output
    return {
      ...user.vendorProfile,
      username: user.username,
    };
  },
  ["vendor-by-username"], // Cache Key Base
  {
    revalidate: 3600, // 1 hour
    tags: ["vendors"], // We can invalidate all vendors or specific ones
  },
);

// --- 2. ROUTER ---

export const vendorRouter = createTRPCRouter({
  // Get current vendor's profile (Session sensitive - DO NOT CACHE SERVER SIDE)
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

  // Get vendor by username (Uses Cache)
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const vendor = await getCachedVendorByUsername(input.username);

      if (!vendor) {
        throw new Error("Vendor not found");
      }

      return vendor;
    }),

  // Get vendors by service ID (Complex Filter - Keep Dynamic)
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
        kybStatus: "APPROVED",
      };

      if (filters.minRating) {
        whereClause.rating = {
          gte: filters.minRating,
        };
      }

      // Geo-spatial Logic
      if (filters.location) {
        const { lat, lon, radius } = filters.location;
        // 1 degree approx 111.1km
        const radiusInDegrees = radius / 111111.0;

        // Raw query for IDs is efficient
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
        // If no serviceIds, return all approved vendors
        // Note: For large datasets, you might want to limit this or cache it if it's a common "Browse All" view
        const allVendors = await ctx.db.vendorProfile.findMany({
          where: {
            kybStatus: "APPROVED",
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
          take: 50, // Added safety limit for shared hosting
        });
        return allVendors.map((vendor) => ({
          ...vendor,
          username: vendor.user.username,
        }));
      }

      // Find vendor profiles that offer ALL specified services
      const vendors = await ctx.db.vendorProfile.findMany({
        where: {
          kybStatus: "APPROVED",
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
        kybStatus: "APPROVED",
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
        regNumber: z.string(),
        businessAddress: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.vendorProfile.update({
        where: { userId: ctx.user.id },
        data: {
          fullName: input.fullName,
          regNumber: input.regNumber,
          businessAddress: input.businessAddress,
          kybStatus: "IN_REVIEW",
        },
      });

      // INVALIDATE CACHE
      // If a vendor updates their details or status changes,
      // their public profile (getByUsername) needs to reflect that (or disappear if no longer approved)
      revalidateTag("vendors", { expire: 0 });

      return updated;
    }),
});
