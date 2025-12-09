import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { NotificationType, QuoteStatus } from "@prisma/client";
import { appRouter } from "@/server/api/root";

export const eventInvitationRouter = createTRPCRouter({
  // Create a new invitation (client sends to vendor)
  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        vendorId: z.string(),
        message: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { eventId, vendorId, message } = input;
      const clientId = ctx.user.id;

      // 1. Verify that the event exists and the user is the owner
      const event = await ctx.db.clientEvent.findFirst({
        where: {
          id: eventId,
          client: {
            userId: clientId,
          },
        },
        select: { title: true },
      });

      if (!event) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Event not found or you do not own this event.",
        });
      }

      // 2. Handle existing pending invitations
      const existingInvitation = await ctx.db.eventInvitation.findFirst({
        where: { eventId, vendorId, status: "PENDING" },
        include: { conversation: { include: { participants: true } } },
      });

      if (existingInvitation) {
        const isVendorParticipant =
          existingInvitation.conversation.participants.some(
            (p) => p.userId === vendorId,
          );
        if (isVendorParticipant) {
          // The invitation and conversation are valid. Just inform the user.
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "A pending invitation has already been sent to this vendor for this event.",
          });
        } else {
          // The conversation is broken (vendor is not a participant). Delete the old invitation.
          await ctx.db.eventInvitation.delete({
            where: { id: existingInvitation.id },
          });
        }
      }

      // 3. Find or create a conversation between the client and vendor
      let conversation = await ctx.db.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: clientId } } },
            { participants: { some: { userId: vendorId } } },
            {
              participants: { every: { userId: { in: [clientId, vendorId] } } },
            },
          ],
        },
      });

      conversation ??= await ctx.db.conversation.create({
        data: {
          participants: {
            create: [{ userId: clientId }, { userId: vendorId }],
          },
        },
      });

      // 4. Create Invitation and Message in a transaction
      const result = await ctx.db.$transaction(async (prisma) => {
        const invitation = await prisma.eventInvitation.create({
          data: {
            clientId,
            vendorId,
            eventId,
            conversationId: conversation.id,
            status: QuoteStatus.PENDING,
          },
        });

        const msgText =
          message ?? `You've been invited to join the event: "${event.title}"`;
        const createdMessage = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: clientId,
            text: msgText,
          },
        });

        const updatedInvitation = await prisma.eventInvitation.update({
          where: { id: invitation.id },
          data: { messageId: createdMessage.id },
          include: {
            vendor: {
              select: {
                username: true,
              },
            },
          },
        });

        await prisma.notification.create({
          data: {
            userId: vendorId,
            type: NotificationType.EVENT_INVITATION,
            message: `You have a new event invitation from ${ctx.user.username} for "${event.title}"`,
            link: `/inbox?conversation=${conversation.id}`,
          },
        });

        return { invitation: updatedInvitation, message: createdMessage };
      });

      return result.invitation;
    }),

  // Update invitation status (for vendors)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([QuoteStatus.ACCEPTED, QuoteStatus.REJECTED]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input;
      const vendorId = ctx.user.id;

      const invitation = await ctx.db.eventInvitation.findFirst({
        where: { id: id, vendorId: vendorId },
        include: { event: { select: { title: true } } },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Invitation not found or you are not authorized to update it.",
        });
      }

      if (invitation.status !== QuoteStatus.PENDING) {
        if (
          invitation.status === QuoteStatus.ACCEPTED &&
          status === QuoteStatus.ACCEPTED
        ) {
          const caller = appRouter.createCaller(ctx);
          await caller.event.addVendor({
            eventId: invitation.eventId,
            vendorId: invitation.vendorId,
          });
          return invitation;
        }
        throw new TRPCError({
          code: "CONFLICT",
          message: `This invitation has already been ${invitation.status.toLowerCase()}.`,
        });
      }

      // Update the invitation status first
      const updatedInvitation = await ctx.db.eventInvitation.update({
        where: { id: id },
        data: { status: status },
      });

      // If accepted, add vendor to the event
      if (status === QuoteStatus.ACCEPTED) {
        const caller = appRouter.createCaller(ctx);
        await caller.event.addVendor({
          eventId: invitation.eventId,
          vendorId: invitation.vendorId,
        });
      }

      await ctx.db.notification.create({
        data: {
          userId: invitation.clientId,
          type: NotificationType.EVENT_INVITATION,
          message: `Your invitation to ${ctx.user.username} for "${invitation.event.title}" has been ${status.toLowerCase()}.`,
          link: `/inbox?conversation=${invitation.conversationId}`,
        },
      });

      return updatedInvitation;
    }),
});
