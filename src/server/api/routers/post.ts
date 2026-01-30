import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { AssetType } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const postRouter = createTRPCRouter({
  // --- 1. CREATE POST ---
  create: protectedProcedure
    .input(
      z.object({
        caption: z
          .string()
          .max(2200, "Caption cannot exceed 2200 characters")
          .optional(),
        assets: z
          .array(
            z.object({
              url: z.string().url(),
              type: z.nativeEnum(AssetType),
              order: z.number().int(),
            }),
          )
          .min(1, "A post must have at least one asset.")
          .max(10, "You cannot upload more than 10 assets per post."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { caption, assets } = input;
      const authorId = ctx.user.id;

      // Rate Limit: Count existing posts
      const currentPostCount = await ctx.db.post.count({
        where: { authorId },
      });

      if (currentPostCount >= 10) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have reached the maximum limit of 10 posts.",
        });
      }

      return ctx.db.post.create({
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
    }),

  // --- 2. GET FEED (Main Timeline) ---
  getFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const { user } = ctx;

      // Exclude blocked users
      let excludedAuthorIds: string[] = [];
      if (user) {
        const blocks = await ctx.db.block.findMany({
          where: {
            OR: [{ blockerId: user.id }, { blockedId: user.id }],
          },
          select: { blockerId: true, blockedId: true },
        });
        excludedAuthorIds = blocks
          .flatMap((b) => [b.blockerId, b.blockedId])
          .filter((id) => id !== user.id);
      }

      const posts = await ctx.db.post.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        where: {
          authorId: { notIn: excludedAuthorIds },
        },
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

      // Append viewer state (liked/bookmarked)
      let postsWithState = posts.map((post) => ({
        ...post,
        viewer: { hasLiked: false, hasBookmarked: false },
      }));

      if (user) {
        const postIds = posts.map((p) => p.id);
        const [likes, bookmarks] = await Promise.all([
          ctx.db.postLike.findMany({
            where: { userId: user.id, postId: { in: postIds } },
            select: { postId: true },
          }),
          ctx.db.postBookmark.findMany({
            where: { userId: user.id, postId: { in: postIds } },
            select: { postId: true },
          }),
        ]);

        const likedSet = new Set(likes.map((l) => l.postId));
        const bookmarkedSet = new Set(bookmarks.map((b) => b.postId));

        postsWithState = posts.map((post) => ({
          ...post,
          viewer: {
            hasLiked: likedSet.has(post.id),
            hasBookmarked: bookmarkedSet.has(post.id),
          },
        }));
      }

      return { items: postsWithState, nextCursor };
    }),

  // --- 3. GET FOR USER PROFILE ---
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

  // --- 4. GET TRENDING ---
  getTrending: publicProcedure
    .input(z.object({ cursor: z.string().nullish() }).optional())
    .query(async ({ ctx, input }) => {
      const limit = 20;
      const { cursor } = input ?? {};

      let excludedAuthorIds: string[] = [];
      if (ctx.user) {
        const blocks = await ctx.db.block.findMany({
          where: {
            OR: [{ blockerId: ctx.user.id }, { blockedId: ctx.user.id }],
          },
          select: { blockerId: true, blockedId: true },
        });
        excludedAuthorIds = blocks
          .flatMap((b) => [b.blockerId, b.blockedId])
          .filter((id) => id !== ctx.user?.id);
      }

      const posts = await ctx.db.post.findMany({
        take: limit + 1,
        where: {
          caption: {
            not: null,
            contains: "#trending", // Simple logic for now
            mode: "insensitive",
          },
          authorId: { notIn: excludedAuthorIds },
        },
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            include: {
              clientProfile: true,
              vendorProfile: true,
            },
          },
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

  // --- 5. GET SINGLE POST (With Viewer State) ---
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

  // --- 6. INTERACTIONS ---
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

  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { commentId } = input;
      const userId = ctx.user.id;

      const comment = await ctx.db.postComment.findUnique({
        where: { id: commentId },
      });

      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      if (comment.authorId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.postComment.delete({
        where: { id: commentId },
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

  // --- 7. MANAGEMENT ---
  delete: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { postId } = input;
      const userId = ctx.user.id;

      const post = await ctx.db.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (post.authorId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.post.delete({
        where: { id: postId },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
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
      const { postId, caption, assets } = input;
      const userId = ctx.user.id;

      const post = await ctx.db.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (post.authorId !== userId) throw new TRPCError({ code: "FORBIDDEN" });

      if (assets.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A post must have at least one asset.",
        });
      }

      return ctx.db.$transaction(async (prisma) => {
        // Replace assets by deleting old ones and re-creating
        await prisma.postAsset.deleteMany({
          where: { postId },
        });

        const updatedPost = await prisma.post.update({
          where: { id: postId },
          data: {
            caption,
            assets: {
              createMany: {
                data: assets,
              },
            },
          },
        });
        return updatedPost;
      });
    }),
});
