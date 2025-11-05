import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const orderRouter = createTRPCRouter({
  createFromQuote: protectedProcedure
    .input(z.object({ quoteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.db.quote.findUnique({
        where: { id: input.quoteId },
      });

      if (!quote) {
        throw new Error("Quote not found");
      }

      return ctx.db.order.create({
        data: {
          vendorId: quote.vendorId,
          clientId: quote.clientId,
          gigId: quote.gigId,
          quoteId: quote.id,
          amount: quote.price,
          eventDate: quote.eventDate,
        },
      });
    }),
});
