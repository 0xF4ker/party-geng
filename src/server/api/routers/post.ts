import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { AssetType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "@/server/db";

// --- 1. CACHED QUERIES ---

// Cache: Global Feed (First 50 posts)
const getCachedGlobalFeed = unstable_cache(
  async () => {
    return await db.post.findMany({
      take: 50, // Fetch more than limit to allow filtering
      orderBy: { createdAt: "desc" },
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
  },
  ["global-feed-latest"],
  {
    revalidate: 60, // Revalidate every minute to update like counts
    tags: ["global-feed"],
  },
);

// Cache: Trending Posts
const getCachedTrendingPosts = unstable_cache(
  async () => {
    return await db.post.findMany({
      take: 50,
      where: {
        caption: {
          not: null,
          contains: "#trending",
          mode: "insensitive",
        },
      },
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
  },
  ["trending-posts-latest"],
  {
    revalidate: 60,
    tags: ["trending-feed"],
  },
);

// Cache: User Profile Feed
const getCachedUserPosts = unstable_cache(
  async (username: string) => {
    return await db.post.findMany({
      where: { author: { username } },
      orderBy: { createdAt: "desc" },
      take: 50,
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
  },
  ["user-posts-feed"], // Dynamic key is handled by the argument wrapper below
  {
    revalidate: 60,
    tags: ["user-feed"], // Generic tag, specific invalidation is hard without dynamic tags
  },
);

// Wrapper to handle dynamic key generation for User Posts
const getUserPosts = (username: string) =>
  unstable_cache(
    async () => {
      return await db.post.findMany({
        where: { author: { username } },
        orderBy: { createdAt: "desc" },
        take: 50,
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
    },
    [`user-feed-${username}`],
    { revalidate: 60, tags: [`user-feed-${username}`] },
  )();

// Cache: Single Post Detail
const getCachedPostById = (postId: string) =>
  unstable_cache(
    async () => {
      return await db.post.findUnique({
        where: { id: postId },
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
    },
    [`post-${postId}`],
    { revalidate: 60, tags: [`post-${postId}`] },
  )();

// --- 2. ROUTER ---

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

      // Rate Limit
      const currentPostCount = await ctx.db.post.count({
        where: { authorId },
      });

      if (currentPostCount >= 10) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have reached the maximum limit of 10 posts.",
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

      // INVALIDATE FEEDS
      revalidateTag("global-feed", "default");
      revalidateTag(`user-feed-${ctx.user.username}`, "default"); // Assuming user has username in context, otherwise fetch it
      if (caption?.includes("#trending")) {
        revalidateTag("trending-feed", "default");
      }

      return post;
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

      // 1. Get Blocks (Dynamic)
      const excludedAuthorIds = new Set<string>();
      if (user) {
        const blocks = await ctx.db.block.findMany({
          where: {
            OR: [{ blockerId: user.id }, { blockedId: user.id }],
          },
          select: { blockerId: true, blockedId: true },
        });
        blocks.forEach((b) => {
          if (b.blockerId !== user.id) excludedAuthorIds.add(b.blockerId);
          if (b.blockedId !== user.id) excludedAuthorIds.add(b.blockedId);
        });
      }

      let posts;

      // 2. Fetch Posts (Cache vs DB)
      if (!cursor) {
        // First page? Use Cache!
        posts = await getCachedGlobalFeed();
      } else {
        // Deep pagination? Hit DB.
        posts = await ctx.db.post.findMany({
          take: limit + 1,
          cursor: { id: cursor },
          orderBy: { createdAt: "desc" },
          // We apply exclusion here for DB query efficiency
          where: {
            authorId: { notIn: Array.from(excludedAuthorIds) },
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
      }

      // 3. Filter Blocked Users (If came from cache)
      if (!cursor && excludedAuthorIds.size > 0) {
        posts = posts.filter((p) => !excludedAuthorIds.has(p.authorId));
      }

      // 4. Pagination Slice
      const slicedPosts = posts.slice(0, limit + 1);
      let nextCursor: string | undefined = undefined;
      if (slicedPosts.length > limit) {
        const nextItem = slicedPosts.pop();
        nextCursor = nextItem!.id;
      }

      // 5. Append Viewer State (Dynamic)
      let postsWithState = slicedPosts.map((post) => ({
        ...post,
        viewer: { hasLiked: false, hasBookmarked: false },
      }));

      if (user) {
        const postIds = slicedPosts.map((p) => p.id);
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

        postsWithState = slicedPosts.map((post) => ({
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
      // Use cached wrapper
      return await getUserPosts(input.username);
    }),

  // --- 4. GET TRENDING ---
  getTrending: publicProcedure
    .input(z.object({ cursor: z.string().nullish() }).optional())
    .query(async ({ ctx, input }) => {
      const limit = 20;
      const { cursor } = input ?? {};

      // 1. Get Blocks
      const excludedAuthorIds = new Set<string>();
      if (ctx.user) {
        const blocks = await ctx.db.block.findMany({
          where: {
            OR: [{ blockerId: ctx.user.id }, { blockedId: ctx.user.id }],
          },
          select: { blockerId: true, blockedId: true },
        });
        blocks.forEach((b) => {
          if (b.blockerId !== ctx.user?.id) excludedAuthorIds.add(b.blockerId);
          if (b.blockedId !== ctx.user?.id) excludedAuthorIds.add(b.blockedId);
        });
      }

      let posts;

      // 2. Fetch (Cache vs DB)
      if (!cursor) {
        posts = await getCachedTrendingPosts();
      } else {
        posts = await ctx.db.post.findMany({
          take: limit + 1,
          where: {
            caption: { contains: "#trending", mode: "insensitive" },
            authorId: { notIn: Array.from(excludedAuthorIds) },
          },
          cursor: { id: cursor },
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              include: { clientProfile: true, vendorProfile: true },
            },
            assets: { orderBy: { order: "asc" }, take: 1 },
            _count: { select: { likes: true, comments: true } },
          },
        });
      }

      // 3. Filter Cache
      if (!cursor && excludedAuthorIds.size > 0) {
        posts = posts.filter((p) => !excludedAuthorIds.has(p.authorId));
      }

      // 4. Pagination
      const slicedPosts = posts.slice(0, limit + 1);
      let nextCursor: string | undefined = undefined;
      if (slicedPosts.length > limit) {
        const nextItem = slicedPosts.pop();
        nextCursor = nextItem!.id;
      }

      return { posts: slicedPosts, nextCursor };
    }),

  // --- 5. GET SINGLE POST ---
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const { user } = ctx;

      // 1. Fetch Cached Post
      const post = await getCachedPostById(id);

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      // 2. Attach Viewer State
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

      const result = await ctx.db.postLike.create({
        data: { postId, userId },
      });

      // Invalidate just the post (Feed counts update on 60s TTL)
      revalidateTag(`post-${postId}`, "default");

      return result;
    }),

  unlike: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { postId } = input;
      const userId = ctx.user.id;

      const result = await ctx.db.postLike.delete({
        where: { postId_userId: { postId, userId } },
      });

      revalidateTag(`post-${postId}`, "default");

      return result;
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

      const result = await ctx.db.postComment.create({
        data: {
          postId,
          authorId,
          text,
          parentId,
        },
      });

      revalidateTag(`post-${postId}`, "default");

      return result;
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

      const result = await ctx.db.postComment.delete({
        where: { id: commentId },
      });

      revalidateTag(`post-${comment.postId}`, "default");

      return result;
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

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (post.authorId !== userId) throw new TRPCError({ code: "FORBIDDEN" });

      const deleted = await ctx.db.post.delete({
        where: { id: postId },
      });

      // Heavy invalidation needed for delete
      revalidateTag(`post-${postId}`, "default");
      revalidateTag("global-feed", "default");
      // Note: We can't easily get the username here without another fetch,
      // but the 60s TTL on feeds will handle it eventually.

      return deleted;
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

        revalidateTag(`post-${postId}`, "default");
        return updatedPost;
      });
    }),
});
