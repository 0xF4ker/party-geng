import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { GuestStatus } from "@prisma/client";

export const invitationRouter = createTRPCRouter({
  getGuestByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const guest = await ctx.db.eventGuest.findUnique({
        where: { invitationToken: input.token },
        include: {
          list: {
            include: {
              event: true,
            },
          },
        },
      });

      if (!guest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found.",
        });
      }
      return guest;
    }),

  respondToInvitation: publicProcedure
    .input(
      z.object({
        token: z.string(),
        status: z.enum([
          GuestStatus.ATTENDING,
          GuestStatus.DECLINED,
          GuestStatus.MAYBE,
          GuestStatus.PENDING,
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const guest = await ctx.db.eventGuest.findUnique({
        where: { invitationToken: input.token },
      });

      if (!guest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found.",
        });
      }

      const updatedGuest = await ctx.db.eventGuest.update({
        where: { id: guest.id },
        data: { status: input.status },
      });

      return updatedGuest;
    }),
});
