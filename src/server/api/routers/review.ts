import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { OrderStatus } from "@prisma/client";

export const reviewRouter = createTRPCRouter({
  getForVendor: publicProcedure
    .input(z.object({ vendorId: z.string() }))
    .query(async ({ ctx, input }) => {
        return ctx.db.review.findMany({
            where: {
                subjectId: input.vendorId,
            },
            include: {
                author: {
                    select: {
                        username: true,
                        clientProfile: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            }
        });
    }),

  createForVendor: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().min(10).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { orderId, rating, comment } = input;
      const clientId = ctx.user.id;

      const order = await ctx.db.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      }

      if (order.clientId !== clientId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to review this order.",
        });
      }

      if (order.status !== OrderStatus.COMPLETED) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You can only review completed orders.",
        });
      }
      
      const existingReview = await ctx.db.review.findUnique({
          where: { orderId },
      });
      
      if (existingReview) {
          throw new TRPCError({
              code: "CONFLICT",
              message: "A review for this order already exists.",
          });
      }

      return ctx.db.$transaction(async (prisma) => {
        const review = await prisma.review.create({
          data: {
            orderId,
            rating,
            comment,
            authorId: clientId,
            subjectId: order.vendorId,
          },
        });

        const vendorReviews = await prisma.review.findMany({
            where: { subjectId: order.vendorId },
            select: { rating: true },
        });

        const totalRating = vendorReviews.reduce((acc, r) => acc + r.rating, 0);
        const newAverageRating = totalRating / vendorReviews.length;

        await prisma.vendorProfile.update({
            where: { userId: order.vendorId },
            data: { rating: newAverageRating },
        });

        return review;
      });
    }),
});
