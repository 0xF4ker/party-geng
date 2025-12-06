import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

const locationSchema = z.object({
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
}).nullable().optional();

export const settingsRouter = createTRPCRouter({
  // Update user profile (name, username, avatar)
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100).optional(),
        username: z.string().min(3).max(30).optional(),
        avatarUrl: z.string().url().optional().nullable(),
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

      const locationData = input.location ? input.location as Prisma.JsonObject : Prisma.JsonNull;

      // Update profile based on role
      if (user.role === "VENDOR") {
        return await ctx.db.vendorProfile.update({
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
      } else {
        return await ctx.db.clientProfile.update({
          where: { userId },
          data: {
            name: input.name,
            avatarUrl: input.avatarUrl,
            location: locationData,
          },
        });
      }
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

      // Get user's email
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

      // Reauthenticate with current password to verify it's correct
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

      // Update password
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
        cacNumber: z.string().optional(),
        cacDocumentUrl: z.string().url().optional(),
        businessAddress: z.string().max(500).optional(),
        state: z.string().optional(),
        lga: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verify user is a vendor
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

      // Update vendor profile with KYC info
      return await ctx.db.vendorProfile.update({
        where: { userId },
        data: {
          fullName: input.fullName,
          meansOfId: input.meansOfId,
          idNumber: input.idNumber,
          idCardUrl: input.idCardUrl,
          cacNumber: input.cacNumber,
          cacDocumentUrl: input.cacDocumentUrl,
          businessAddress: input.businessAddress,
          state: input.state,
          lga: input.lga,
          kycStatus: "IN_REVIEW", // Auto-submit for review
        },
      });
    }),

  // Get upload URL for Supabase Storage (used by client to upload files)
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

      // Generate unique file path: userId/timestamp-filename
      const timestamp = Date.now();
      const filePath = `${userId}/${timestamp}-${input.fileName}`;

      return {
        bucket,
        filePath,
        publicUrl:
          input.fileType === "profile-image"
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`
            : null, // KYC documents are private
      };
    }),

  // New procedure to update vendor's services
  updateVendorServices: protectedProcedure
    .input(
      z.object({
        serviceIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verify user is a vendor
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

      // Start a transaction to ensure atomicity
      await ctx.db.$transaction([
        // Delete all existing services for this vendor
        ctx.db.servicesOnVendors.deleteMany({
          where: { vendorProfileId: vendorProfileId },
        }),
        // Create new entries for the selected services
        ctx.db.servicesOnVendors.createMany({
          data: input.serviceIds.map((serviceId) => ({
            vendorProfileId: vendorProfileId,
            serviceId: serviceId,
          })),
        }),
      ]);

      return { success: true };
    }),
});
