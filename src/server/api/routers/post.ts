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

const postInclude = {
  assets: { orderBy: { order: "asc" } },
  author: {
    include: {
      clientProfile: true,
      vendorProfile: true,
    },
  },
  parentPost: {
    include: {
      author: {
        include: { clientProfile: true, vendorProfile: true },
      },
      assets: { orderBy: { order: "asc" } },
      _count: { select: { likes: true, comments: true, reposts: true } },
    },
  },
  _count: {
    select: { likes: true, comments: true, reposts: true },
  },
} as const;
const getCachedGlobalFeed = unstable_cache(
  async () => {
    return await db.post.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: postInclude,
    });
  },
  ["global-feed-latest"],
  {
    revalidate: 60,
    tags: ["global-feed"],
  },
);
const getCachedTrendingPosts = unstable_cache(
  async () => {
    return await db.post.findMany({
      take: 60,
      orderBy: [
        { likes: { _count: "desc" } },
        { createdAt: "desc" },
      ],
      include: postInclude,
    });
  },
  ["trending-posts-latest"],
  {
    revalidate: 60,
    tags: ["trending-feed"],
  },
);
const getCachedUserPosts = unstable_cache(
  async (username: string) => {
    return await db.post.findMany({
      where: { author: { username } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        assets: { orderBy: { order: "asc" } },
        author: {
          include: {
            clientProfile: true,
            vendorProfile: true,
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });
  },
  ["user-posts-feed"],
  {
    revalidate: 60,
    tags: ["user-feed"],
  },
);
const getUserPosts = (username: string) =>
  unstable_cache(
    async () => {
      return await db.post.findMany({
        where: { author: { username } },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: postInclude,
      });
    },
    [`user-feed-${username}`],
    { revalidate: 60, tags: [`user-feed-${username}`] },
  )();
const getCachedPostById = (postId: string) =>
  unstable_cache(
    async () => {
      return await db.post.findUnique({
        where: { id: postId },
        include: {
          ...postInclude,
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
export const postRouter = createTRPCRouter({
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
      const currentPostCount = await ctx.db.post.count({
        where: { authorId },
      });
      if (currentPostCount >= 10) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have reached the maximum limit of 10 posts.",
        });
      }
      // Extract hashtags
      const hashtags: string[] = [];
      if (caption) {
        const matches = caption.match(/#[\w\u0080-\uFFFF]+/g);
        if (matches) {
          matches.forEach((m) => {
            const name = m.substring(1).toLowerCase();
            if (!hashtags.includes(name)) {
              hashtags.push(name);
            }
          });
        }
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
          hashtags: {
            connectOrCreate: hashtags.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        },
      });
      revalidateTag("global-feed", "default");
      revalidateTag(`user-feed-${ctx.user.username}`, "default");
      revalidateTag("trending-feed", "default");
      return post;
    }),
  getFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        followingOnly: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, followingOnly } = input;
      const { user } = ctx;
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
      if (user && followingOnly) {
        // Strict Following feed: show posts strictly from users followed + current user
        const follows = await ctx.db.follow.findMany({
          where: { followerId: user.id },
          select: { followingId: true },
        });
        const followingIds = follows.map((f) => f.followingId);
        followingIds.push(user.id);

        posts = await ctx.db.post.findMany({
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { createdAt: "desc" },
          where: {
            authorId: {
              in: followingIds,
              notIn: Array.from(excludedAuthorIds),
            },
          },
          include: postInclude,
        });
      } else {
        // Global / Latest feed: show community posts
        if (!cursor) {
          posts = await getCachedGlobalFeed();
        } else {
          posts = await ctx.db.post.findMany({
            take: limit + 1,
            cursor: { id: cursor },
            orderBy: { createdAt: "desc" },
            where: {
              authorId: { notIn: Array.from(excludedAuthorIds) },
            },
            include: postInclude,
          });
        }
      }
      if (!cursor && excludedAuthorIds.size > 0) {
        posts = posts.filter((p) => !excludedAuthorIds.has(p.authorId));
      }
      const slicedPosts = posts.slice(0, limit + 1);
      let nextCursor: string | undefined = undefined;
      if (slicedPosts.length > limit) {
        const nextItem = slicedPosts.pop();
        nextCursor = nextItem!.id;
      }
      let postsWithState = slicedPosts.map((post) => ({
        ...post,
        viewer: { hasLiked: false, hasBookmarked: false },
        parentPost: post.parentPost ? {
          ...post.parentPost,
          viewer: { hasLiked: false, hasBookmarked: false },
        } : null,
      }));
      if (user) {
        const postIds = slicedPosts.flatMap((p) => [p.id, p.parentPostId].filter(Boolean) as string[]);
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
          parentPost: post.parentPost ? {
            ...post.parentPost,
            viewer: {
              hasLiked: likedSet.has(post.parentPost.id),
              hasBookmarked: bookmarkedSet.has(post.parentPost.id),
            },
          } : null,
        }));
      }
      return { items: postsWithState, nextCursor };
    }),
  getForUser: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      return await getUserPosts(input.username);
    }),
  getTrending: publicProcedure
    .input(z.object({ cursor: z.string().nullish() }).optional())
    .query(async ({ ctx, input }) => {
      const limit = 20;
      const { cursor } = input ?? {};
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
      if (!cursor) {
        posts = await getCachedTrendingPosts();
      } else {
        posts = await ctx.db.post.findMany({
            take: limit + 1,
            where: {
              authorId: { notIn: Array.from(excludedAuthorIds) },
            },
            cursor: { id: cursor },
            orderBy: [
              { likes: { _count: "desc" } },
              { createdAt: "desc" },
            ],
            include: postInclude,
          });
      }
      if (!cursor && excludedAuthorIds.size > 0) {
        posts = posts.filter((p) => !excludedAuthorIds.has(p.authorId));
      }
      const slicedPosts = posts.slice(0, limit + 1);
      let nextCursor: string | undefined = undefined;
      if (slicedPosts.length > limit) {
        const nextItem = slicedPosts.pop();
        nextCursor = nextItem!.id;
      }
      // Add viewer state
      let postsWithState = slicedPosts.map((post) => ({
        ...post,
        viewer: { hasLiked: false, hasBookmarked: false },
        parentPost: post.parentPost ? {
          ...post.parentPost,
          viewer: { hasLiked: false, hasBookmarked: false },
        } : null,
      }));
      if (ctx.user) {
        const postIds = slicedPosts.flatMap((p) => [p.id, p.parentPostId].filter(Boolean) as string[]);
        const [likes, bookmarks] = await Promise.all([
          ctx.db.postLike.findMany({
            where: { userId: ctx.user.id, postId: { in: postIds } },
            select: { postId: true },
          }),
          ctx.db.postBookmark.findMany({
            where: { userId: ctx.user.id, postId: { in: postIds } },
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
          parentPost: post.parentPost ? {
            ...post.parentPost,
            viewer: {
              hasLiked: likedSet.has(post.parentPost.id),
              hasBookmarked: bookmarkedSet.has(post.parentPost.id),
            },
          } : null,
        }));
      }
      return { posts: postsWithState, nextCursor };
    }),
  getBookmarked: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;
      const userId = ctx.user.id;

      const bookmarks = await ctx.db.postBookmark.findMany({
        take: limit + 1,
        cursor: cursor ? { postId_userId: { postId: cursor, userId } } : undefined,
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          post: {
            include: postInclude,
          },
        },
      });

      const slicedBookmarks = bookmarks.slice(0, limit + 1);
      let nextCursor: string | undefined = undefined;
      if (slicedBookmarks.length > limit) {
        const nextItem = slicedBookmarks.pop();
        nextCursor = nextItem!.postId;
      }

      let postsWithState = slicedBookmarks.map((b) => {
        const post = b.post;
        return {
          ...post,
          viewer: {
            hasLiked: false,
            hasBookmarked: true,
          },
          parentPost: post.parentPost ? {
            ...post.parentPost,
            viewer: {
              hasLiked: false,
              hasBookmarked: false,
            },
          } : null,
        };
      });

      if (postsWithState.length > 0) {
        const postIds = postsWithState.flatMap((p) => [p.id, p.parentPostId].filter(Boolean) as string[]);
        const [likes, parentBookmarks] = await Promise.all([
          ctx.db.postLike.findMany({
            where: { userId, postId: { in: postIds } },
            select: { postId: true },
          }),
          ctx.db.postBookmark.findMany({
            where: { userId, postId: { in: postIds } },
            select: { postId: true },
          }),
        ]);
        const likedSet = new Set(likes.map((l) => l.postId));
        const bookmarkedSet = new Set(parentBookmarks.map((b) => b.postId));
        postsWithState = postsWithState.map((post) => ({
          ...post,
          viewer: {
            hasLiked: likedSet.has(post.id),
            hasBookmarked: bookmarkedSet.has(post.id) || post.viewer.hasBookmarked,
          },
          parentPost: post.parentPost ? {
            ...post.parentPost,
            viewer: {
              hasLiked: likedSet.has(post.parentPost.id),
              hasBookmarked: bookmarkedSet.has(post.parentPost.id),
            },
          } : null,
        }));
      }

      return { posts: postsWithState, nextCursor };
    }),
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const { user } = ctx;
      const post = await getCachedPostById(id);
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      let parentPost = post.parentPost ? {
        ...post.parentPost,
        viewer: { hasLiked: false, hasBookmarked: false },
      } : null;
      let viewer = { hasLiked: false, hasBookmarked: false };
      if (user) {
        const [like, bookmark, parentLike, parentBookmark] = await Promise.all([
          ctx.db.postLike.findUnique({
            where: { postId_userId: { postId: id, userId: user.id } },
          }),
          ctx.db.postBookmark.findUnique({
            where: { postId_userId: { postId: id, userId: user.id } },
          }),
          post.parentPostId ? ctx.db.postLike.findUnique({
            where: { postId_userId: { postId: post.parentPostId, userId: user.id } },
          }) : null,
          post.parentPostId ? ctx.db.postBookmark.findUnique({
            where: { postId_userId: { postId: post.parentPostId, userId: user.id } },
          }) : null,
        ]);
        viewer = {
          hasLiked: !!like,
          hasBookmarked: !!bookmark,
        };
        if (post.parentPost) {
          parentPost = {
            ...post.parentPost,
            viewer: {
              hasLiked: !!parentLike,
              hasBookmarked: !!parentBookmark,
            },
          };
        }
      }
      return { ...post, parentPost, viewer };
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
      const result = await ctx.db.postLike.create({
        data: { postId, userId },
      });
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
      revalidateTag(`post-${postId}`, "default");
      revalidateTag("global-feed", "default");
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

        // Extract hashtags
        const hashtags: string[] = [];
        if (caption) {
          const matches = caption.match(/#[\w\u0080-\uFFFF]+/g);
          if (matches) {
            matches.forEach((m) => {
              const name = m.substring(1).toLowerCase();
              if (!hashtags.includes(name)) {
                hashtags.push(name);
              }
            });
          }
        }

        return await prisma.post.update({
          where: { id: postId },
          data: {
            caption,
            assets: {
              createMany: {
                data: assets,
              },
            },
            hashtags: {
              set: [],
              connectOrCreate: hashtags.map((name) => ({
                where: { name },
                create: { name },
              })),
            },
          },
        });
      });
    }),

  repost: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { postId } = input;
      const authorId = ctx.user.id;

      const originalPost = await ctx.db.post.findUnique({
        where: { id: postId },
      });

      if (!originalPost) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Original post not found.",
        });
      }

      const existingRepost = await ctx.db.post.findFirst({
        where: {
          authorId,
          parentPostId: postId,
        },
      });

      if (existingRepost) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already reposted this post.",
        });
      }

      const repost = await ctx.db.post.create({
        data: {
          authorId,
          parentPostId: postId,
        },
      });

      revalidateTag("global-feed", "default");
      revalidateTag(`user-feed-${ctx.user.username}`, "default");
      revalidateTag("trending-feed", "default");

      return repost;
    }),

  recordView: publicProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { postId } = input;
      const userId = ctx.user?.id;

      return await ctx.db.postView.create({
        data: {
          postId,
          userId,
        },
      });
    }),
});
