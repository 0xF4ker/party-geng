import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
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
            email: true,
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
          vendorProfile: true,
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

  submitKyc: protectedProcedure
    .input(
      z.object({
        fullName: z.string(),
        cacNumber: z.string(),
        businessAddress: z.string(),
      })
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
