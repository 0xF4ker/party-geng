import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { z } from "zod";

export const gigRouter = createTRPCRouter({
  // Create a new gig
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        serviceId: z.number(),
        tags: z.array(z.string()).max(5),
        basePrice: z.number(),
        basePriceIncludes: z.array(z.string()),
        addOns: z
          .array(
            z.object({
              title: z.string(),
              price: z.number(),
            }),
          )
          .optional(),
        faqs: z
          .array(
            z.object({
              q: z.string(),
              a: z.string(),
            }),
          )
          .optional(),
        galleryImageUrls: z.array(z.string()).optional(),
        youtubeUrl: z.string().optional(),
        status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).default("DRAFT"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const vendorProfile = await ctx.db.vendorProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!vendorProfile) {
        throw new Error("Vendor profile not found");
      }

      const { addOns, ...gigData } = input;

      return ctx.db.gig.create({
        data: {
          ...gigData,
          vendorProfileId: vendorProfile.id,
          addOns: addOns
            ? {
                create: addOns,
              }
            : undefined,
        },
        include: {
          addOns: true,
          service: {
            include: {
              category: true,
            },
          },
        },
      });
    }),

  // Update an existing gig
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        serviceId: z.number().optional(),
        tags: z.array(z.string()).max(5).optional(),
        basePrice: z.number().optional(),
        basePriceIncludes: z.array(z.string()).optional(),
        addOns: z
          .array(
            z.object({
              id: z.number().optional(),
              title: z.string(),
              price: z.number(),
            }),
          )
          .optional(),
        faqs: z
          .array(
            z.object({
              q: z.string(),
              a: z.string(),
            }),
          )
          .optional(),
        galleryImageUrls: z.array(z.string()).optional(),
        youtubeUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, addOns, ...updateData } = input;

      // Verify ownership
      const gig = await ctx.db.gig.findUnique({
        where: { id },
        include: { vendor: true },
      });

      if (!gig || gig.vendor.userId !== ctx.user.id) {
        throw new Error("Gig not found or unauthorized");
      }

      // Handle add-ons update
      if (addOns) {
        // Delete existing add-ons and create new ones
        await ctx.db.gigAddOn.deleteMany({
          where: { gigId: id },
        });
      }

      return ctx.db.gig.update({
        where: { id },
        data: {
          ...updateData,
          addOns: addOns
            ? {
                create: addOns.map(({ id: _id, ...addOn }) => addOn),
              }
            : undefined,
        },
        include: {
          addOns: true,
          service: {
            include: {
              category: true,
            },
          },
        },
      });
    }),

  // Delete a gig
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const gig = await ctx.db.gig.findUnique({
        where: { id: input.id },
        include: { vendor: true },
      });

      if (!gig || gig.vendor.userId !== ctx.user.id) {
        throw new Error("Gig not found or unauthorized");
      }

      return ctx.db.gig.delete({
        where: { id: input.id },
      });
    }),

  // Update gig status (Active, Paused, Draft)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const gig = await ctx.db.gig.findUnique({
        where: { id: input.id },
        include: { vendor: true },
      });

      if (!gig || gig.vendor.userId !== ctx.user.id) {
        throw new Error("Gig not found or unauthorized");
      }

      return ctx.db.gig.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  // Get all gigs for the current vendor
  getMyGigs: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const vendorProfile = await ctx.db.vendorProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!vendorProfile) {
        throw new Error("Vendor profile not found");
      }

      return ctx.db.gig.findMany({
        where: {
          vendorProfileId: vendorProfile.id,
          ...(input?.status ? { status: input.status } : {}),
        },
        include: {
          addOns: true,
          service: {
            include: {
              category: true,
            },
          },
          _count: {
            select: {
              quotes: true,
              orders: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  // Get a single gig by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.gig.findUnique({
        where: { id: input.id },
        include: {
          addOns: true,
          service: {
            include: {
              category: true,
            },
          },
          vendor: {
            include: {
              user: {
                select: {
                  username: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              quotes: true,
              orders: true,
            },
          },
        },
      });
    }),

  // Get gig statistics for vendor dashboard
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const vendorProfile = await ctx.db.vendorProfile.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!vendorProfile) {
      throw new Error("Vendor profile not found");
    }

    const [
      totalGigs,
      activeGigs,
      pendingQuotes,
      activeOrders,
      monthlyEarnings,
    ] = await Promise.all([
      ctx.db.gig.count({
        where: { vendorProfileId: vendorProfile.id },
      }),
      ctx.db.gig.count({
        where: {
          vendorProfileId: vendorProfile.id,
          status: "ACTIVE",
        },
      }),
      ctx.db.quote.count({
        where: {
          vendorId: ctx.user.id,
          status: "PENDING",
        },
      }),
      ctx.db.order.count({
        where: {
          vendorId: ctx.user.id,
          status: "ACTIVE",
        },
      }),
      ctx.db.order.aggregate({
        where: {
          vendorId: ctx.user.id,
          status: "COMPLETED",
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      totalGigs,
      activeGigs,
      pendingQuotes,
      activeOrders,
      monthlyEarnings: monthlyEarnings._sum.amount ?? 0,
    };
  }),

  // Get gigs by vendor username (for public profile)
  getByVendorUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const vendor = await ctx.db.user.findUnique({
        where: { username: input.username },
        include: {
          vendorProfile: true,
        },
      });

      if (!vendor || !vendor.vendorProfile) {
        throw new Error("Vendor not found");
      }

      return ctx.db.gig.findMany({
        where: {
          vendorProfileId: vendor.vendorProfile.id,
          status: "ACTIVE",
        },
        include: {
          addOns: true,
          service: {
            include: {
              category: true,
            },
          },
          _count: {
            select: {
              quotes: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  // Get gigs by service with filters
  getByService: publicProcedure
    .input(
      z.object({
        serviceId: z.number().optional(),
        serviceName: z.string().optional(),
        filters: z
          .object({
            minBudget: z.number().optional(),
            maxBudget: z.number().optional(),
            vendorLevels: z.array(z.string()).optional(),
            tags: z.array(z.string()).optional(),
          })
          .optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { serviceId, serviceName, filters, limit, offset } = input;

      interface GigFilter {
        serviceId?: number;
        service?: {
          name: {
            contains: string;
            mode: "insensitive";
          };
        };
        basePrice?: {
          gte?: number;
          lte?: number;
        };
        vendor?: {
          level?: {
            in?: string[];
          };
        };
        tags?: {
          hasSome: string[];
        };
        status?: "ACTIVE";
      }

      // Build where clause
      const whereClause: GigFilter = {
        status: "ACTIVE",
      };

      // Service filter
      if (serviceId) {
        whereClause.serviceId = serviceId;
      } else if (serviceName) {
        whereClause.service = {
          name: {
            contains: serviceName,
            mode: "insensitive",
          },
        };
      }

      // Budget filter
      if (
        filters?.minBudget !== undefined ||
        filters?.maxBudget !== undefined
      ) {
        whereClause.basePrice = {};
        if (filters.minBudget) whereClause.basePrice.gte = filters.minBudget;
        if (filters.maxBudget) whereClause.basePrice.lte = filters.maxBudget;
      }

      // Vendor level filter
      if (filters?.vendorLevels && filters.vendorLevels.length > 0) {
        whereClause.vendor = {
          level: {
            in: filters.vendorLevels,
          },
        };
      }

      // Tags filter
      if (filters?.tags && filters.tags.length > 0) {
        whereClause.tags = {
          hasSome: filters.tags,
        };
      }

      const [gigs, totalCount] = await Promise.all([
        ctx.db.gig.findMany({
          where: whereClause,
          include: {
            addOns: true,
            service: {
              include: {
                category: true,
              },
            },
            vendor: {
              include: {
                user: {
                  select: {
                    username: true,
                  },
                },
              },
            },
            _count: {
              select: {
                quotes: true,
                orders: true,
              },
            },
          },
          take: limit,
          skip: offset,
          orderBy: {
            createdAt: "desc",
          },
        }),
        ctx.db.gig.count({ where: whereClause }),
      ]);

      return {
        gigs,
        totalCount,
        hasMore: offset + limit < totalCount,
      };
    }),
});
