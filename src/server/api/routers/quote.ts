import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const quoteRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        gigId: z.string(),
        clientId: z.string(),
        conversationId: z.string(),
        title: z.string(),
        price: z.number(),
        eventDate: z.date(),
        includes: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.quote.create({
        data: {
          gigId: input.gigId,
          vendorId: ctx.user.id,
          clientId: input.clientId,
          conversationId: input.conversationId,
          title: input.title,
          price: input.price,
          eventDate: input.eventDate,
          includes: input.includes,
        },
      });
    }),
});
