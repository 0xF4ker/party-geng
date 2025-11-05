import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const gigRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        serviceId: z.number(),
        basePrice: z.number(),
        basePriceIncludes: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const vendorProfile = await ctx.db.vendorProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!vendorProfile) {
        throw new Error("Vendor profile not found");
      }

      return ctx.db.gig.create({
        data: {
          title: input.title,
          description: input.description,
          serviceId: input.serviceId,
          basePrice: input.basePrice,
          basePriceIncludes: input.basePriceIncludes,
          vendorProfileId: vendorProfile.id,
        },
      });
    }),
});
