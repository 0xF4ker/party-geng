import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const personalTodoRouter = createTRPCRouter({
  getByEventId: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db, user } = ctx;
      const { eventId } = input;

      const event = await db.clientEvent.findUnique({
        where: { id: eventId },
        select: { client: { select: { userId: true } } },
      });

      if (event?.client.userId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own event todos.",
        });
      }

      return db.eventPersonalTodo.findMany({
        where: { eventId },
        orderBy: { createdAt: "asc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        content: z.string().min(1),
        dueDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      const { eventId, content, dueDate } = input;

      const event = await db.clientEvent.findUnique({
        where: { id: eventId },
        select: { client: { select: { userId: true } } },
      });

      if (event?.client.userId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only add todos to your own events.",
        });
      }

      return db.eventPersonalTodo.create({
        data: {
          eventId,
          content,
          dueDate,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).optional(),
        dueDate: z.date().optional().nullable(),
        isCompleted: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      const { id, ...data } = input;

      const todo = await db.eventPersonalTodo.findUnique({
        where: { id },
        include: { event: { include: { client: true } } },
      });

      if (todo?.event.client.userId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own todos.",
        });
      }

      return db.eventPersonalTodo.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx;
      const { id } = input;

      const todo = await db.eventPersonalTodo.findUnique({
        where: { id },
        include: { event: { include: { client: true } } },
      });

      if (todo?.event.client.userId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own todos.",
        });
      }

      await db.eventPersonalTodo.delete({ where: { id } });
      return { success: true };
    }),
});
