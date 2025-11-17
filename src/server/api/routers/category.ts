import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { unslugify } from "@/lib/utils";
import { TRPCError } from "@trpc/server";

export const categoryRouter = createTRPCRouter({
  // Get all categories with their services
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      include: {
        services: {
          include: {
            _count: {
              select: {
                vendors: true, // Count vendors instead of gigs
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

  getPopularServices: publicProcedure.query(async ({ ctx }) => {
    const popularServices = await ctx.db.service.findMany({
      select: {
        name: true,
        slug: true,
        category: {
          select: {
            slug: true,
          },
        },
        _count: {
          select: {
            vendors: true,
          },
        },
      },
      orderBy: {
        vendors: {
          _count: "desc",
        },
      },
      take: 5,
    });

    return popularServices.map((service) => ({
      label: service.name,
      value: service.slug,
      categorySlug: service.category.slug,
      type: "service" as const,
    }));
  }),

  getSearchList: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.category.findMany({
      select: {
        name: true,
        slug: true,
      },
    });

    const services = await ctx.db.service.findMany({
      select: {
        name: true,
        slug: true,
        category: {
          select: {
            slug: true,
          },
        },
      },
    });

    const searchList = [
      ...categories.map((category) => ({
        label: category.name,
        value: category.slug,
        type: "category" as const,
      })),
      ...services.map((service) => ({
        label: service.name,
        value: service.slug,
        categorySlug: service.category.slug,
        type: "service" as const,
      })),
    ];

    return searchList;
  }),

  // Get category by slug with services and popular gigs
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const decodedSlug = decodeURIComponent(input.slug);
      const category = await ctx.db.category.findFirst({
        where: {
          slug: decodedSlug,
        },
        include: {
          services: {
            include: {
              _count: {
                select: {
                  vendors: true, // Count vendors instead of gigs
                },
              },
            },
          },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
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

  // Get a single service by slug
  getServiceBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const service = await ctx.db.service.findUnique({
        where: {
          slug: input.slug,
        },
        select: {
          id: true,
          name: true,
          categoryId: true,
        },
      });

      if (!service) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      return service;
    }),
});
