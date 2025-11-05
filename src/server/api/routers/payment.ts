import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const paymentRouter = createTRPCRouter({
  getWallet: protectedProcedure.query(({ ctx }) => {
    return ctx.db.wallet.findUnique({
      where: { userId: ctx.user.id },
    });
  }),
});
