import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { AssetType } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const socialRouter = createTRPCRouter({
  // ─── FOLLOW SYSTEM ───
  follow: protectedProcedure
    .input(z.object({ followingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const followerId = ctx.user.id;
      const { followingId } = input;

      if (followerId === followingId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot follow yourself.",
        });
      }

      const existingFollow = await ctx.db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (existingFollow) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already following this user.",
        });
      }

      const followResult = await ctx.db.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      try {
        // Fetch follower details to construct a personalized notification message
        const followerUser = await ctx.db.user.findUnique({
          where: { id: followerId },
          include: {
            clientProfile: true,
            vendorProfile: true,
          },
        });

        if (followerUser) {
          const followerName =
            (followerUser.role === "VENDOR"
              ? followerUser.vendorProfile?.companyName
              : followerUser.clientProfile?.name) ?? followerUser.username;

          await ctx.db.notification.create({
            data: {
              userId: followingId,
              type: "NEW_FOLLOW" as any,
              message: `${followerName} started following you.`,
              link: followerUser.role === "VENDOR"
                ? `/v/${followerUser.username}`
                : `/c/${followerUser.username}`,
            },
          });
        }
      } catch (error) {
        console.error("Failed to create follow notification:", error);
      }

      return followResult;
    }),

  unfollow: protectedProcedure
    .input(z.object({ followingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const followerId = ctx.user.id;
      const { followingId } = input;

      try {
        return await ctx.db.follow.delete({
          where: {
            followerId_followingId: {
              followerId,
              followingId,
            },
          },
        });
      } catch {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not following this user.",
        });
      }
    }),

  getFollowing: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.follow.findMany({
        where: { followerId: input.userId },
        include: {
          following: {
            include: {
              clientProfile: true,
              vendorProfile: true,
            },
          },
        },
      });
    }),

  getFollowers: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.follow.findMany({
        where: { followingId: input.userId },
        include: {
          follower: {
            include: {
              clientProfile: true,
              vendorProfile: true,
            },
          },
        },
      });
    }),

  // ─── STORIES SYSTEM ───
  createStory: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        type: z.nativeEnum(AssetType),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.user.id;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      return await ctx.db.story.create({
        data: {
          authorId,
          url: input.url,
          type: input.type,
          expiresAt,
        },
      });
    }),

  getActiveStories: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const now = new Date();

    // Fetch follows to know whose stories to show (plus user's own stories)
    const follows = await ctx.db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const activeUserIds = [userId, ...follows.map((f) => f.followingId)];

    // Fetch active stories
    const stories = await ctx.db.story.findMany({
      where: {
        authorId: { in: activeUserIds },
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          include: {
            clientProfile: true,
            vendorProfile: true,
          },
        },
        views: {
          where: { userId },
        },
      },
    });

    // Group stories by author
    const groupsMap = new Map<
      string,
      {
        author: typeof stories[number]["author"];
        stories: typeof stories;
        hasUnviewed: boolean;
      }
    >();

    for (const story of stories) {
      const existing = groupsMap.get(story.authorId);
      const isViewed = story.views.length > 0;

      if (existing) {
        existing.stories.push(story);
        if (!isViewed) {
          existing.hasUnviewed = true;
        }
      } else {
        groupsMap.set(story.authorId, {
          author: story.author,
          stories: [story],
          hasUnviewed: !isViewed,
        });
      }
    }

    // Sort: self first, then by latest story date desc
    const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => {
      if (a.author.id === userId) return -1;
      if (b.author.id === userId) return 1;
      const aLatest = a.stories[a.stories.length - 1]?.createdAt.getTime() ?? 0;
      const bLatest = b.stories[b.stories.length - 1]?.createdAt.getTime() ?? 0;
      return bLatest - aLatest;
    });

    return sortedGroups;
  }),

  viewStory: protectedProcedure
    .input(z.object({ storyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { storyId } = input;

      const existingView = await ctx.db.storyView.findUnique({
        where: {
          storyId_userId: {
            storyId,
            userId,
          },
        },
      });

      if (existingView) return existingView;

      return await ctx.db.storyView.create({
        data: {
          storyId,
          userId,
        },
      });
    }),

  // ─── TRENDING HASHTAGS ───
  getTrendingHashtags: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.hashtag.findMany({
      take: 8,
      orderBy: {
        posts: {
          _count: "desc",
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: { posts: true },
        },
      },
    });
  }),
});
