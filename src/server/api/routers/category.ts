  import { createTRPCRouter, publicProcedure, adminProcedure } from "@/server/api/trpc";
  import { z } from "zod";
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

      // --- NEW ADMIN MUTATIONS ---

  // 1. Manage Categories
  upsertCategory: adminProcedure
    .input(
      z.object({
        id: z.number().optional(), // If present, update. If null, create.
        name: z.string().min(1),
        slug: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = input.slug || slugify(input.name);

      // Check for slug collision
      const existing = await ctx.db.category.findFirst({
        where: {
          slug,
          NOT: input.id ? { id: input.id } : undefined,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A category with this name or slug already exists.",
        });
      }

      if (input.id) {
        // UPDATE
        const updated = await ctx.db.category.update({
          where: { id: input.id },
          data: { name: input.name, slug },
        });
        await logActivity({
          ctx,
          action: "CATEGORY_UPDATE",
          entityType: "CATEGORY",
          entityId: String(updated.id),
          details: { name: input.name },
        });
        return updated;
      } else {
        // CREATE
        const created = await ctx.db.category.create({
          data: { name: input.name, slug },
        });
        await logActivity({
          ctx,
          action: "CATEGORY_CREATE",
          entityType: "CATEGORY",
          entityId: String(created.id),
          details: { name: input.name },
        });
        return created;
      }
    }),

  deleteCategory: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check if it has services
      const count = await ctx.db.service.count({
        where: { categoryId: input.id },
      });

      if (count > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete category. It contains ${count} services. Move or delete them first.`,
        });
      }

      const deleted = await ctx.db.category.delete({
        where: { id: input.id },
      });

      await logActivity({
        ctx,
        action: "CATEGORY_DELETE",
        entityType: "CATEGORY",
        entityId: String(input.id),
        details: { name: deleted.name },
      });

      return deleted;
    }),

  // 2. Manage Services
  upsertService: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        categoryId: z.number(),
        name: z.string().min(1),
        slug: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = input.slug || slugify(input.name);

      const existing = await ctx.db.service.findFirst({
        where: {
          slug,
          NOT: input.id ? { id: input.id } : undefined,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A service with this name or slug already exists.",
        });
      }

      if (input.id) {
        // UPDATE
        const updated = await ctx.db.service.update({
          where: { id: input.id },
          data: {
            name: input.name,
            slug,
            categoryId: input.categoryId,
          },
        });
        await logActivity({
          ctx,
          action: "SERVICE_UPDATE",
          entityType: "SERVICE",
          entityId: String(updated.id),
          details: { name: input.name, categoryId: input.categoryId },
        });
        return updated;
      } else {
        // CREATE
        const created = await ctx.db.service.create({
          data: {
            name: input.name,
            slug,
            categoryId: input.categoryId,
          },
        });
        await logActivity({
          ctx,
          action: "SERVICE_CREATE",
          entityType: "SERVICE",
          entityId: String(created.id),
          details: { name: input.name, categoryId: input.categoryId },
        });
        return created;
      }
    }),

  deleteService: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check for vendor usage
      const vendorCount = await ctx.db.servicesOnVendors.count({
        where: { serviceId: input.id },
      });

      if (vendorCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete service. It is used by ${vendorCount} vendors.`,
        });
      }

      const deleted = await ctx.db.service.delete({
        where: { id: input.id },
      });

      await logActivity({
        ctx,
        action: "SERVICE_DELETE",
        entityType: "SERVICE",
        entityId: String(input.id),
        details: { name: deleted.name },
      });

      return deleted;
    }),
  });
