import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { slugify } from "@/lib/utils";
import { logActivity } from "../services/activityLogger";
import { revalidateTag, unstable_cache } from "next/cache";
import { db } from "@/server/db";

// --- 1. CACHED QUERIES (Defined outside the router) ---

// Cache: All Categories (Heavy query with includes)
const getCachedAllCategories = unstable_cache(
  async () => {
    return await db.category.findMany({
      include: {
        services: {
          include: {
            _count: {
              select: {
                vendors: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  },
  ["all-categories-full"], // Cache Key
  {
    revalidate: 3600, // Default 1 hour
    tags: ["categories"], // Tag for invalidation
  },
);

// Cache: Popular Services (Computationally expensive sorting)
const getCachedPopularServices = unstable_cache(
  async () => {
    const popularServices = await db.service.findMany({
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
  },
  ["popular-services"],
  {
    revalidate: 3600,
    tags: ["services", "categories"],
  },
);

// Cache: Search List (Combines two tables)
const getCachedSearchList = unstable_cache(
  async () => {
    const categories = await db.category.findMany({
      select: { name: true, slug: true },
    });

    const services = await db.service.findMany({
      select: {
        name: true,
        slug: true,
        category: { select: { slug: true } },
      },
    });

    return [
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
  },
  ["global-search-list"],
  {
    revalidate: 3600,
    tags: ["search-list", "categories", "services"],
  },
);

// --- 2. ROUTER IMPLEMENTATION ---

export const categoryRouter = createTRPCRouter({
  // Get all categories (Uses Cache)
  getAll: publicProcedure.query(async () => {
    return await getCachedAllCategories();
  }),

  // Get popular services (Uses Cache)
  getPopularServices: publicProcedure.query(async () => {
    return await getCachedPopularServices();
  }),

  // Get search list (Uses Cache)
  getSearchList: publicProcedure.query(async () => {
    return await getCachedSearchList();
  }),

  // Get category by slug (Direct DB - Cursors/Slugs are hard to cache efficiently)
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
                  vendors: true,
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

  // --- NEW ADMIN MUTATIONS (With Cache Invalidation) ---

  // 1. Manage Categories
  upsertCategory: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        slug: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      ctx.auditFlags.disabled = true;

      const slug = input.slug ?? slugify(input.name);

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

      let result;
      if (input.id) {
        // UPDATE
        result = await ctx.db.category.update({
          where: { id: input.id },
          data: { name: input.name, slug },
        });
        await logActivity({
          ctx,
          action: "CATEGORY_UPDATE",
          entityType: "CATEGORY",
          entityId: String(result.id),
          details: { name: input.name },
        });
      } else {
        // CREATE
        result = await ctx.db.category.create({
          data: { name: input.name, slug },
        });
        await logActivity({
          ctx,
          action: "CATEGORY_CREATE",
          entityType: "CATEGORY",
          entityId: String(result.id),
          details: { name: input.name },
        });
      }

      // INVALIDATE CACHE
      // We pass { expire: 0 } to force immediate expiration (Standard in Next.js 15+ for Admin actions)
      revalidateTag("categories", { expire: 0 });
      revalidateTag("search-list", { expire: 0 });

      return result;
    }),

  deleteCategory: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      ctx.auditFlags.disabled = true;

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

      // INVALIDATE CACHE
      revalidateTag("categories", { expire: 0 });
      revalidateTag("search-list", { expire: 0 });

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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      ctx.auditFlags.disabled = true;

      const slug = input.slug ?? slugify(input.name);

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

      let result;
      if (input.id) {
        // UPDATE
        result = await ctx.db.service.update({
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
          entityId: String(result.id),
          details: { name: input.name, categoryId: input.categoryId },
        });
      } else {
        // CREATE
        result = await ctx.db.service.create({
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
          entityId: String(result.id),
          details: { name: input.name, categoryId: input.categoryId },
        });
      }

      // INVALIDATE CACHE
      // Services affect "services", "categories" (via counts), and "search-list"
      revalidateTag("services", { expire: 0 });
      revalidateTag("categories", { expire: 0 });
      revalidateTag("search-list", { expire: 0 });

      return result;
    }),

  deleteService: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      ctx.auditFlags.disabled = true;

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

      // INVALIDATE CACHE
      revalidateTag("services", { expire: 0 });
      revalidateTag("categories", { expire: 0 });
      revalidateTag("search-list", { expire: 0 });

      return deleted;
    }),
});
