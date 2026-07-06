import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { GuestStatus } from "@prisma/client";
import { emailService } from "../../services/emailService";

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
        include: {
          ticketTier: true,
          list: {
            include: {
              event: true,
            },
          },
        },
      });

      // Send GUEST_CONFIRMATION email if attending
      if (input.status === GuestStatus.ATTENDING && updatedGuest.email) {
        try {
          const event = updatedGuest.list.event;
          
          // Formatted Date
          const eventDate = new Date(event.startDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          // Formatted Location
          const locationObj = event.location as any;
          const locationString = locationObj?.display_name || locationObj?.displayName || locationObj?.address || "To Be Announced";

          // Maps Link
          let mapsLink: string | undefined = undefined;
          if (locationObj?.lat && locationObj?.lon) {
            mapsLink = `https://www.google.com/maps/search/?api=1&query=${locationObj.lat},${locationObj.lon}`;
          } else if (locationString && locationString !== "To Be Announced") {
            mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationString)}`;
          }

          // Price & Ticket
          const priceString = updatedGuest.ticketTier 
            ? `₦${updatedGuest.ticketTier.price.toLocaleString()}` 
            : event.isTicketed 
              ? `₦${event.ticketPrice.toLocaleString()}` 
              : "Free Admission";

          await emailService.send({
            to: updatedGuest.email,
            subject: `RSVP Confirmed: ${event.title}`,
            template: "GUEST_CONFIRMATION",
            data: {
              name: updatedGuest.name,
              eventTitle: event.title,
              date: eventDate,
              location: locationString,
              mapsLink,
              ticketTierName: updatedGuest.ticketTier?.name ?? undefined,
              ticketPrice: priceString,
              tableNumber: updatedGuest.tableNumber !== null ? String(updatedGuest.tableNumber) : undefined,
              hasPaid: updatedGuest.hasPaid,
            },
          });
        } catch (err) {
          console.error("Failed to send guest confirmation email:", err);
        }
      }

      return updatedGuest;
    }),
});
