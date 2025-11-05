import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const vendorRouter = createTRPCRouter({
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
