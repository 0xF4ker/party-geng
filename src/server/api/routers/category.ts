import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const categoryRouter = createTRPCRouter({
  // Get all categories with their services
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      include: {
        services: {
          include: {
            _count: {
              select: {
                gigs: {
                  where: {
                    status: "ACTIVE",
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }),

  // Get category by slug with services and popular gigs
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      // Convert slug to potential category name
      // e.g., "music-djs" -> "Music & DJs" or "Music Djs"
      const slugParts = input.slug.split("-");
      const potentialNames = [
        // Try with & symbol
        slugParts
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" & "),
        // Try with spaces only
        slugParts
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        // Try original with dashes
        slugParts
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join("-"),
      ];

      // Try to find the category with any of the potential names
      let category = null;
      for (const name of potentialNames) {
        category = await ctx.db.category.findFirst({
          where: {
            name: {
              equals: name,
              mode: "insensitive",
            },
          },
          include: {
            services: {
              include: {
                gigs: {
                  where: { status: "ACTIVE" },
                  take: 8,
                  orderBy: {
                    createdAt: "desc",
                  },
                  include: {
                    vendor: {
                      select: {
                        companyName: true,
                        avatarUrl: true,
                        level: true,
                        rating: true,
                      },
                    },
                  },
                },
                _count: {
                  select: {
                    gigs: {
                      where: {
                        status: "ACTIVE",
                      },
                    },
                  },
                },
              },
            },
          },
        });
        if (category) break;
      }

      return category;
    }),

  // Get a single category by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.category.findUnique({
        where: { id: input.id },
        include: {
          services: true,
        },
      });
    }),

  // Get services by category ID
  getServicesByCategory: publicProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.service.findMany({
        where: { categoryId: input.categoryId },
        orderBy: {
          name: "asc",
        },
      });
    }),
});
