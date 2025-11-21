import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { AssetType } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        caption: z.string().optional(),
        assets: z.array(
          z.object({
            url: z.string().url(),
            type: z.nativeEnum(AssetType),
            order: z.number().int(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { caption, assets } = input;
      const authorId = ctx.user.id;

      if (assets.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A post must have at least one asset.",
        });
      }

      const post = await ctx.db.post.create({
        data: {
          authorId,
          caption,
          assets: {
            createMany: {
              data: assets,
            },
          },
        },
      });

      return post;
    }),

  getForUser: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.post.findMany({
        where: { author: { username: input.username } },
        orderBy: { createdAt: "desc" },
        include: {
          assets: { orderBy: { order: "asc" } },
          author: {
            select: {
              id: true,
              username: true,
              clientProfile: true,
              vendorProfile: true,
            },
          },
          _count: {
            select: { likes: true, comments: true },
          },
        },
      });
    }),

  getTrending: publicProcedure
        .input(z.object({ cursor: z.string().nullish() }).optional())
        .query(async ({ ctx, input }) => {
          const limit = 20;
          const { cursor } = input ?? {};
          const posts = await ctx.db.post.findMany({
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: "desc" },
            include: {
              assets: { orderBy: { order: "asc" }, take: 1 },
              _count: {
                select: { likes: true, comments: true },
              },
            },
          });
          let nextCursor: string | undefined = undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem!.id;
      }
      return { posts, nextCursor };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const { user } = ctx;

      const post = await ctx.db.post.findUnique({
        where: { id },
        include: {
          assets: { orderBy: { order: "asc" } },
          author: {
            select: {
              id: true,
              username: true,
              clientProfile: true,
              vendorProfile: true,
              role: true,
            },
          },
          comments: {
            orderBy: { createdAt: "desc" },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  clientProfile: true,
                  vendorProfile: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: { likes: true, comments: true },
          },
        },
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      let viewer = { hasLiked: false, hasBookmarked: false };
      if (user) {
        const [like, bookmark] = await Promise.all([
          ctx.db.postLike.findUnique({
            where: { postId_userId: { postId: id, userId: user.id } },
          }),
          ctx.db.postBookmark.findUnique({
            where: { postId_userId: { postId: id, userId: user.id } },
          }),
        ]);
        viewer = {
          hasLiked: !!like,
          hasBookmarked: !!bookmark,
        };
      }

      return { ...post, viewer };
    }),

  like: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { postId } = input;
      const userId = ctx.user.id;

      const existingLike = await ctx.db.postLike.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      if (existingLike) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Post already liked.",
        });
      }

      return ctx.db.postLike.create({
        data: { postId, userId },
      });
    }),

  unlike: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { postId } = input;
      const userId = ctx.user.id;

      return ctx.db.postLike.delete({
        where: { postId_userId: { postId, userId } },
      });
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        text: z.string().min(1).max(1000),
        parentId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { postId, text, parentId } = input;
      const authorId = ctx.user.id;

      return ctx.db.postComment.create({
        data: {
          postId,
          authorId,
          text,
          parentId,
        },
      });
    }),

  bookmark: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { postId } = input;
      const userId = ctx.user.id;

      const existingBookmark = await ctx.db.postBookmark.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      if (existingBookmark) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Post already bookmarked.",
        });
      }

      return ctx.db.postBookmark.create({
        data: { postId, userId },
      });
    }),

  removeBookmark: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { postId } = input;
      const userId = ctx.user.id;

      return ctx.db.postBookmark.delete({
        where: { postId_userId: { postId, userId } },
      });
    }),
});

