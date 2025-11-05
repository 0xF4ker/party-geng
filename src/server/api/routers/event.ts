import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const eventRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        date: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clientProfile = await ctx.db.clientProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!clientProfile) {
        throw new Error("Client profile not found");
      }

      return ctx.db.clientEvent.create({
        data: {
          title: input.title,
          date: input.date,
          clientProfileId: clientProfile.id,
        },
      });
    }),
});
