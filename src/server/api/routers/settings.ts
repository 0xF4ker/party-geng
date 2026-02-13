import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache"; // 1. Import revalidateTag

const locationSchema = z
  .object({
    place_id: z.number(),
    licence: z.string(),
    osm_type: z.string(),
    osm_id: z.number(),
    boundingbox: z.array(z.string()),
    lat: z.string(),
    lon: z.string(),
    display_name: z.string(),
    class: z.string(),
    type: z.string(),
    importance: z.number(),
    icon: z.string().optional(),
  })
  .nullable()
  .optional();

export const settingsRouter = createTRPCRouter({
  // Update user profile (name, username, avatar)
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100).optional(),
        username: z.string().min(3).max(30).optional(),
        avatarUrl: z.string().url().optional().nullable(),
        bio: z.string().max(500).optional(),
        // Vendor-specific fields
        companyName: z.string().min(2).max(100).optional(),
        title: z.string().max(200).optional(),
        about: z.string().max(5000).optional(),
        skills: z.array(z.string()).optional(),
        location: locationSchema,
        languages: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get user's role
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if username is taken (if updating username)
      if (input.username) {
        const existingUser = await ctx.db.user.findFirst({
          where: {
            username: input.username,
            id: { not: userId },
          },
        });

        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Username already taken",
          });
        }

        // Update username in User table
        await ctx.db.user.update({
          where: { id: userId },
          data: { username: input.username },
        });
      }

      const locationData = input.location
        ? (input.location as Prisma.JsonObject)
        : Prisma.JsonNull;

      // Update profile based on role
      if (user.role === "VENDOR") {
        await ctx.db.vendorProfile.update({
          where: { userId },
          data: {
            companyName: input.companyName,
            title: input.title,
            avatarUrl: input.avatarUrl,
            about: input.about,
            skills: input.skills,
            location: locationData,
            languages: input.languages,
          },
        });

        // INVALIDATE: Vendor public profile changed
        revalidateTag("vendors", "default");
        revalidateTag("users", "default"); // Vendors are also users
      } else {
        await ctx.db.clientProfile.update({
          where: { userId },
          data: {
            name: input.name,
            avatarUrl: input.avatarUrl,
            location: locationData,
            bio: input.bio,
          },
        });

        // INVALIDATE: Client public profile changed
        revalidateTag("users", "default");
      }

      return { success: true };
    }),

  // Update password
  updatePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(6),
        newPassword: z.string().min(6),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const authResult = await ctx.supabase.auth.signInWithPassword({
        email: user.email,
        password: input.currentPassword,
      });

      if (authResult.error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      const updateResult = await ctx.supabase.auth.updateUser({
        password: input.newPassword,
      });

      if (updateResult.error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: updateResult.error.message,
        });
      }

      return { success: true };
    }),

  // Submit KYC for vendors
  submitKyc: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(2).max(100),
        meansOfId: z.string().optional(),
        idNumber: z.string().optional(),
        idCardUrl: z.string().url().optional(),
        regNumber: z.string().optional(),
        cacDocumentUrl: z.string().url().optional(),
        businessAddress: z.string().max(500).optional(),
        state: z.string().optional(),
        lga: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { role: true, vendorProfile: true },
      });

      if (user?.role !== "VENDOR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only vendors can submit KYC",
        });
      }

      if (!user.vendorProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vendor profile not found",
        });
      }

      const updated = await ctx.db.vendorProfile.update({
        where: { userId },
        data: {
          fullName: input.fullName,
          meansOfId: input.meansOfId,
          idNumber: input.idNumber,
          idCardUrl: input.idCardUrl,
          regNumber: input.regNumber,
          cacDocumentUrl: input.cacDocumentUrl,
          businessAddress: input.businessAddress,
          state: input.state,
          lga: input.lga,
          kybStatus: "IN_REVIEW",
        },
      });

      // INVALIDATE: Status changed, remove from public lists if needed
      revalidateTag("vendors", "default");

      return updated;
    }),

  submitKyb: protectedProcedure
    .input(
      z.object({
        companyName: z.string().min(2, "Company name is required"),
        businessAddress: z.string().min(5, "Address is required"),
        about: z.string().optional(),
        country: z.string().min(2, "Country is required"),
        regNumber: z.string().min(2, "Registration number is required"),
        fullName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        include: { vendorProfile: true },
      });

      if (!user || user.role !== "VENDOR" || !user.vendorProfile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Action restricted to vendors.",
        });
      }

      const updated = await ctx.db.vendorProfile.update({
        where: { id: user.vendorProfile.id },
        data: {
          companyName: input.companyName,
          businessAddress: input.businessAddress,
          about: input.about,
          country: input.country,
          regNumber: input.regNumber,
          fullName: input.fullName,
          kybStatus: "IN_REVIEW",
        },
      });

      // INVALIDATE: Status changed to IN_REVIEW, potentially hide from public
      revalidateTag("vendors", "default");

      return updated;
    }),

  getUploadUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.enum(["profile-image", "kyc-document"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const bucket =
        input.fileType === "profile-image" ? "profile-images" : "kyc-documents";

      const timestamp = Date.now();
      const filePath = `${userId}/${timestamp}-${input.fileName}`;

      return {
        bucket,
        filePath,
        publicUrl:
          input.fileType === "profile-image"
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`
            : null,
      };
    }),

  updateVendorServices: protectedProcedure
    .input(
      z.object({
        serviceIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { role: true, vendorProfile: true },
      });

      if (user?.role !== "VENDOR" || !user.vendorProfile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only vendors can update their services",
        });
      }

      const vendorProfileId = user.vendorProfile.id;

      await ctx.db.$transaction([
        ctx.db.servicesOnVendors.deleteMany({
          where: { vendorProfileId: vendorProfileId },
        }),
        ctx.db.servicesOnVendors.createMany({
          data: input.serviceIds.map((serviceId) => ({
            vendorProfileId: vendorProfileId,
            serviceId: serviceId,
          })),
        }),
      ]);

      // INVALIDATE:
      // 1. "vendors" (This specific vendor now shows up in different searches)
      // 2. "services" (Service vendor counts have changed)
      // 3. "categories" (Category service counts might have changed)
      revalidateTag("vendors", "default");
      revalidateTag("services", "default");
      revalidateTag("categories", "default");

      return { success: true };
    }),
});
