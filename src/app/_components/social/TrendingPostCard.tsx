"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  CheckCircle2,
  Repeat2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type TrendingPost =
  RouterOutputs["post"]["getTrending"]["posts"][number];

interface TrendingPostCardProps {
  post: TrendingPost;
  onOpenModal: () => void;
  onHashtagClick?: (tag: string) => void;
}

// ---------------------------------------------------------------------------
// Hashtag highlighting helper
// ---------------------------------------------------------------------------
function renderCaption(text: string, onHashtagClick?: (tag: string) => void) {
  const parts = text.split(/(#\w+)/g);
  return parts.map((part, i) =>
    /^#\w+$/.test(part) ? (
      <span
        key={i}
        onClick={(e) => {
          if (onHashtagClick) {
            e.stopPropagation();
            e.preventDefault();
            onHashtagClick(part);
          }
        }}
        className="cursor-pointer font-semibold text-[var(--l-brand-pink)] hover:underline"
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TrendingPostCard({
  post,
  onOpenModal,
  onHashtagClick,
}: TrendingPostCardProps) {
  const { user, isAuthenticated } = useAuth();
  const utils = api.useUtils();

  // ---- Local UI state ----
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  // ---- Double-tap detection ----
  const lastTapRef = useRef<number>(0);

  // ---- Repost check ----
  const isRepost = !!post.parentPost;
  const targetPost = post.parentPost ?? post;

  // ---- Derived author info ----
  const author = post.author;
  const isVendor = author.role === "VENDOR";
  const avatarUrl = isVendor
    ? author.vendorProfile?.avatarUrl
    : author.clientProfile?.avatarUrl;
  const displayName =
    (isVendor
      ? author.vendorProfile?.companyName
      : author.clientProfile?.name) ?? author.username;
  const profileUrl = `/${isVendor ? "v" : "c"}/${author.username}`;

  // ---- Original Post info (if repost) ----
  const parentAuthor = targetPost.author;
  const isParentVendor = parentAuthor.role === "VENDOR";
  const parentAvatarUrl = isParentVendor
    ? parentAuthor.vendorProfile?.avatarUrl
    : parentAuthor.clientProfile?.avatarUrl;
  const parentDisplayName =
    (isParentVendor
      ? parentAuthor.vendorProfile?.companyName
      : parentAuthor.clientProfile?.name) ?? parentAuthor.username;
  const parentProfileUrl = `/${isParentVendor ? "v" : "c"}/${parentAuthor.username}`;

  const isOwnPost = user?.id === author.id;

  // ---- Viewer state ----
  const isLiked = targetPost.viewer?.hasLiked ?? false;
  const isBookmarked = targetPost.viewer?.hasBookmarked ?? false;



  // =====================================================================
  // Optimistic update helper for all feed queries
  // =====================================================================
  const updateCache = useCallback(
    (
      postId: string,
      updater: (p: any) => any,
    ) => {
      // 1. Update trending query cache
      utils.post.getTrending.setInfiniteData({}, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) => {
              if (p.id === postId) return updater(p);
              if (p.parentPost && p.parentPost.id === postId) {
                return { ...p, parentPost: updater(p.parentPost) };
              }
              return p;
            }),
          })),
        };
      });

      // 2a. Update Following feed query cache
      utils.post.getFeed.setInfiniteData({ limit: 20, followingOnly: true }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((p) => {
              if (p.id === postId) return updater(p);
              if (p.parentPost && p.parentPost.id === postId) {
                return { ...p, parentPost: updater(p.parentPost) };
              }
              return p;
            }),
          })),
        };
      });

      // 2b. Update Latest feed query cache
      utils.post.getFeed.setInfiniteData({ limit: 20, followingOnly: false }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((p) => {
              if (p.id === postId) return updater(p);
              if (p.parentPost && p.parentPost.id === postId) {
                return { ...p, parentPost: updater(p.parentPost) };
              }
              return p;
            }),
          })),
        };
      });

      // 3. Update bookmarked query cache (Saved)
      utils.post.getBookmarked.setInfiniteData({}, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) => {
              if (p.id === postId) return updater(p);
              if (p.parentPost && p.parentPost.id === postId) {
                return { ...p, parentPost: updater(p.parentPost) };
              }
              return p;
            }),
          })),
        };
      });
    },
    [utils],
  );

  // =====================================================================
  // Like / Unlike mutations
  // =====================================================================
  const likeMutation = api.post.like.useMutation({
    onMutate: async ({ postId }) => {
      await Promise.all([
        utils.post.getTrending.cancel(),
        utils.post.getFeed.cancel({ limit: 20, followingOnly: true }),
        utils.post.getFeed.cancel({ limit: 20, followingOnly: false }),
        utils.post.getBookmarked.cancel(),
      ]);
      const prevTrending = utils.post.getTrending.getInfiniteData({});
      const prevFeedTrue = utils.post.getFeed.getInfiniteData({ limit: 20, followingOnly: true });
      const prevFeedFalse = utils.post.getFeed.getInfiniteData({ limit: 20, followingOnly: false });
      const prevBookmarked = utils.post.getBookmarked.getInfiniteData({});

      updateCache(postId, (p) => ({
        ...p,
        _count: { ...p._count, likes: p._count.likes + 1 },
        viewer: { ...p.viewer, hasLiked: true },
      }));

      return { prevTrending, prevFeedTrue, prevFeedFalse, prevBookmarked };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) {
        if (ctx.prevTrending) utils.post.getTrending.setInfiniteData({}, ctx.prevTrending);
        if (ctx.prevFeedTrue) utils.post.getFeed.setInfiniteData({ limit: 20, followingOnly: true }, ctx.prevFeedTrue);
        if (ctx.prevFeedFalse) utils.post.getFeed.setInfiniteData({ limit: 20, followingOnly: false }, ctx.prevFeedFalse);
        if (ctx.prevBookmarked) utils.post.getBookmarked.setInfiniteData({}, ctx.prevBookmarked);
      }
    },
    onSettled: () => {
      void utils.post.getTrending.invalidate();
      void utils.post.getFeed.invalidate({ limit: 20, followingOnly: true });
      void utils.post.getFeed.invalidate({ limit: 20, followingOnly: false });
      void utils.post.getBookmarked.invalidate();
    },
  });

  const unlikeMutation = api.post.unlike.useMutation({
    onMutate: async ({ postId }) => {
      await Promise.all([
        utils.post.getTrending.cancel(),
        utils.post.getFeed.cancel({ limit: 20, followingOnly: true }),
        utils.post.getFeed.cancel({ limit: 20, followingOnly: false }),
        utils.post.getBookmarked.cancel(),
      ]);
      const prevTrending = utils.post.getTrending.getInfiniteData({});
      const prevFeedTrue = utils.post.getFeed.getInfiniteData({ limit: 20, followingOnly: true });
      const prevFeedFalse = utils.post.getFeed.getInfiniteData({ limit: 20, followingOnly: false });
      const prevBookmarked = utils.post.getBookmarked.getInfiniteData({});

      updateCache(postId, (p) => ({
        ...p,
        _count: { ...p._count, likes: Math.max(0, p._count.likes - 1) },
        viewer: { ...p.viewer, hasLiked: false },
      }));

      return { prevTrending, prevFeedTrue, prevFeedFalse, prevBookmarked };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) {
        if (ctx.prevTrending) utils.post.getTrending.setInfiniteData({}, ctx.prevTrending);
        if (ctx.prevFeedTrue) utils.post.getFeed.setInfiniteData({ limit: 20, followingOnly: true }, ctx.prevFeedTrue);
        if (ctx.prevFeedFalse) utils.post.getFeed.setInfiniteData({ limit: 20, followingOnly: false }, ctx.prevFeedFalse);
        if (ctx.prevBookmarked) utils.post.getBookmarked.setInfiniteData({}, ctx.prevBookmarked);
      }
    },
    onSettled: () => {
      void utils.post.getTrending.invalidate();
      void utils.post.getFeed.invalidate({ limit: 20, followingOnly: true });
      void utils.post.getFeed.invalidate({ limit: 20, followingOnly: false });
      void utils.post.getBookmarked.invalidate();
    },
  });

  // =====================================================================
  // Bookmark / Remove bookmark mutations
  // =====================================================================
  const bookmarkMutation = api.post.bookmark.useMutation({
    onMutate: async ({ postId }) => {
      await Promise.all([
        utils.post.getTrending.cancel(),
        utils.post.getFeed.cancel({ limit: 20, followingOnly: true }),
        utils.post.getFeed.cancel({ limit: 20, followingOnly: false }),
        utils.post.getBookmarked.cancel(),
      ]);
      const prevTrending = utils.post.getTrending.getInfiniteData({});
      const prevFeedTrue = utils.post.getFeed.getInfiniteData({ limit: 20, followingOnly: true });
      const prevFeedFalse = utils.post.getFeed.getInfiniteData({ limit: 20, followingOnly: false });
      const prevBookmarked = utils.post.getBookmarked.getInfiniteData({});

      updateCache(postId, (p) => ({
        ...p,
        viewer: { ...p.viewer, hasBookmarked: true },
      }));

      return { prevTrending, prevFeedTrue, prevFeedFalse, prevBookmarked };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) {
        if (ctx.prevTrending) utils.post.getTrending.setInfiniteData({}, ctx.prevTrending);
        if (ctx.prevFeedTrue) utils.post.getFeed.setInfiniteData({ limit: 20, followingOnly: true }, ctx.prevFeedTrue);
        if (ctx.prevFeedFalse) utils.post.getFeed.setInfiniteData({ limit: 20, followingOnly: false }, ctx.prevFeedFalse);
        if (ctx.prevBookmarked) utils.post.getBookmarked.setInfiniteData({}, ctx.prevBookmarked);
      }
    },
    onSettled: () => {
      void utils.post.getTrending.invalidate();
      void utils.post.getFeed.invalidate({ limit: 20, followingOnly: true });
      void utils.post.getFeed.invalidate({ limit: 20, followingOnly: false });
      void utils.post.getBookmarked.invalidate();
    },
  });

  const removeBookmarkMutation = api.post.removeBookmark.useMutation({
    onMutate: async ({ postId }) => {
      await Promise.all([
        utils.post.getTrending.cancel(),
        utils.post.getFeed.cancel({ limit: 20, followingOnly: true }),
        utils.post.getFeed.cancel({ limit: 20, followingOnly: false }),
        utils.post.getBookmarked.cancel(),
      ]);
      const prevTrending = utils.post.getTrending.getInfiniteData({});
      const prevFeedTrue = utils.post.getFeed.getInfiniteData({ limit: 20, followingOnly: true });
      const prevFeedFalse = utils.post.getFeed.getInfiniteData({ limit: 20, followingOnly: false });
      const prevBookmarked = utils.post.getBookmarked.getInfiniteData({});

      updateCache(postId, (p) => ({
        ...p,
        viewer: { ...p.viewer, hasBookmarked: false },
      }));

      return { prevTrending, prevFeedTrue, prevFeedFalse, prevBookmarked };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) {
        if (ctx.prevTrending) utils.post.getTrending.setInfiniteData({}, ctx.prevTrending);
        if (ctx.prevFeedTrue) utils.post.getFeed.setInfiniteData({ limit: 20, followingOnly: true }, ctx.prevFeedTrue);
        if (ctx.prevFeedFalse) utils.post.getFeed.setInfiniteData({ limit: 20, followingOnly: false }, ctx.prevFeedFalse);
        if (ctx.prevBookmarked) utils.post.getBookmarked.setInfiniteData({}, ctx.prevBookmarked);
      }
    },
    onSettled: () => {
      void utils.post.getTrending.invalidate();
      void utils.post.getFeed.invalidate({ limit: 20, followingOnly: true });
      void utils.post.getFeed.invalidate({ limit: 20, followingOnly: false });
      void utils.post.getBookmarked.invalidate();
    },
  });

  // =====================================================================
  // Repost mutation
  // =====================================================================
  const repostMutation = api.post.repost.useMutation({
    onSuccess: () => {
      toast.success("Reposted successfully!");
      void utils.post.getTrending.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to repost");
    },
  });

  // =====================================================================
  // Handlers
  // =====================================================================
  const requireAuth = () => {
    if (!isAuthenticated) {
      toast("Login required");
      return false;
    }
    return true;
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth()) return;
    repostMutation.mutate({ postId: targetPost.id });
  };

  const handleLikeToggle = () => {
    if (!requireAuth()) return;
    if (isLiked) {
      unlikeMutation.mutate({ postId: targetPost.id });
    } else {
      likeMutation.mutate({ postId: targetPost.id });
    }
  };

  const handleBookmarkToggle = () => {
    if (!requireAuth()) return;
    if (isBookmarked) {
      removeBookmarkMutation.mutate({ postId: targetPost.id });
    } else {
      bookmarkMutation.mutate({ postId: targetPost.id });
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${targetPost.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  // Double-tap to like on the image area
  const handleImageTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double-tap detected
      if (!isLiked) {
        if (requireAuth()) {
          likeMutation.mutate({ postId: targetPost.id });
        }
      }
      // Always show the heart animation on double-tap
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
    }
    lastTapRef.current = now;
  };

  // =====================================================================
  // Render
  // =====================================================================
  const firstAsset = targetPost.assets[0];
  const multipleAssets = targetPost.assets.length > 1;

  return (
    <article className="group/card bg-white rounded-2xl border border-[var(--l-border)] shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      {/* Repost Header Indicator if it is a repost */}
      {isRepost && (
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-0 text-[11px] font-bold text-[var(--l-brand-purple)] animate-fade-in">
          <Repeat2 className="h-3.5 w-3.5" />
          <span>{displayName} reposted</span>
        </div>
      )}

      {/* ─── 1. HEADER ─── */}
      <div className="flex items-center gap-3 p-4">
        {/* Avatar */}
        <Link href={profileUrl} className="shrink-0">
          <div
            className={cn(
              "relative h-10 w-10 overflow-hidden rounded-full bg-gray-100",
              isVendor && "ring-2 ring-[var(--l-brand-purple)]/40 ring-offset-1",
            )}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </Link>

        {/* Name + username */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={profileUrl}
              className="text-sm font-bold text-[var(--l-text)] truncate hover:underline"
            >
              {displayName}
            </Link>
            {isVendor && (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 fill-blue-500 text-white" />
            )}

          </div>
          <p className="text-xs text-[var(--l-text-muted)] truncate">
            @{author.username}
          </p>
        </div>

        {/* Timestamp + menu */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--l-text-muted)] whitespace-nowrap">
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
            })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[var(--l-text-muted)] hover:text-[var(--l-text)] hover:bg-gray-100/80 rounded-full"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ─── 2. MEDIA / NESTED CONTENT ─── */}
      {isRepost ? (
        /* Inset box for nested parent post content */
        <div className="mx-4 mb-3 rounded-xl border border-gray-100 overflow-hidden bg-gray-50/50 p-3 hover:bg-gray-50/80 transition-colors">
          {/* Inner Header (Original Author) */}
          <div className="flex items-center gap-2 mb-2">
            <Link href={parentProfileUrl} className="shrink-0">
              <div
                className={cn(
                  "relative h-6 w-6 overflow-hidden rounded-full bg-gray-200",
                  isParentVendor && "ring-1 ring-[var(--l-brand-purple)]/40 ring-offset-1",
                )}
              >
                {parentAvatarUrl ? (
                  <Image
                    src={parentAvatarUrl}
                    alt={parentDisplayName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-gray-400 bg-gray-300">
                    {parentDisplayName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <Link
                  href={parentProfileUrl}
                  className="text-xs font-bold text-[var(--l-text)] truncate hover:underline"
                >
                  {parentDisplayName}
                </Link>
                {isParentVendor && (
                  <CheckCircle2 className="h-3 w-3 shrink-0 fill-blue-500 text-white" />
                )}
              </div>
              <p className="text-[10px] text-[var(--l-text-muted)] truncate">
                @{parentAuthor.username}
              </p>
            </div>
          </div>

          {/* Inner Media */}
          {firstAsset && (
            <div
              className="relative aspect-[16/9] w-full rounded-lg overflow-hidden mb-2 cursor-pointer select-none"
              onClick={handleImageTap}
            >
              <Image
                src={firstAsset.url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 512px"
              />
              
              {/* Double-tap heart animation for nested media */}
              {showHeartAnim && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <Heart className="h-12 w-12 fill-white text-white drop-shadow-lg animate-heart-burst" />
                </div>
              )}
            </div>
          )}

          {/* Inner Caption */}
          {targetPost.caption && (
            <p className="text-xs text-[var(--l-text)] leading-relaxed">
              {renderCaption(targetPost.caption, onHashtagClick)}
            </p>
          )}
        </div>
      ) : (
        /* Normal full-bleed media */
        firstAsset && (
          <div
            className="relative w-full cursor-pointer select-none overflow-hidden"
            onClick={handleImageTap}
          >
            <div className="relative aspect-[4/5] w-full transition-transform duration-300 ease-out group-hover/card:scale-[1.01]">
              <Image
                src={firstAsset.url}
                alt={post.caption ?? "Post image"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>

            {/* Multi-asset dot indicators */}
            {multipleAssets && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {targetPost.assets.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-colors",
                      i === 0 ? "bg-white" : "bg-white/50",
                    )}
                  />
                ))}
              </div>
            )}

            {/* Double-tap heart animation */}
            {showHeartAnim && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <Heart className="h-20 w-20 fill-white text-white drop-shadow-lg animate-heart-burst" />
              </div>
            )}
          </div>
        )
      )}

      {/* ─── 3. ENGAGEMENT BAR ─── */}
      <div className="flex items-center px-4 pt-3 pb-1">
        <div className="flex items-center gap-1">
          {/* Like */}
          <button
            onClick={handleLikeToggle}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200",
              "hover:bg-pink-50 active:scale-95",
              isLiked
                ? "text-[var(--l-brand-pink)]"
                : "text-[var(--l-text-muted)] hover:text-[var(--l-brand-pink)]",
            )}
          >
            <Heart
              className={cn(
                "h-[18px] w-[18px] transition-transform duration-200",
                isLiked && "fill-current scale-110",
              )}
            />
            <span>{targetPost._count.likes}</span>
          </button>

          {/* Comment */}
          <button
            onClick={onOpenModal}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--l-text-muted)] transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
          >
            <MessageCircle className="h-[18px] w-[18px]" />
            <span>{targetPost._count.comments}</span>
          </button>

          {/* Repost */}
          <button
            onClick={handleRepost}
            disabled={repostMutation.isPending}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--l-text-muted)] transition-all duration-200 active:scale-95",
              "hover:bg-green-50 hover:text-green-600",
              repostMutation.isPending && "opacity-50 cursor-not-allowed"
            )}
          >
            {repostMutation.isPending ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin text-green-600" />
            ) : (
              <Repeat2 className="h-[18px] w-[18px]" />
            )}
            <span>{targetPost._count.reposts ?? 0}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--l-text-muted)] transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95"
          >
            <Send className="h-[18px] w-[18px] -rotate-45" />
          </button>
        </div>

        {/* Bookmark — right aligned */}
        <button
          onClick={handleBookmarkToggle}
          className={cn(
            "ml-auto rounded-full p-1.5 transition-all duration-200 active:scale-95",
            "hover:bg-amber-50",
            isBookmarked
              ? "text-amber-500"
              : "text-[var(--l-text-muted)] hover:text-amber-500",
          )}
        >
          <Bookmark
            className={cn(
              "h-[18px] w-[18px] transition-transform duration-200",
              isBookmarked && "fill-current",
            )}
          />
        </button>
      </div>

      {/* ─── 4. CAPTION ─── */}
      {!isRepost && post.caption && (
        <div className="px-4 pb-1">
          <p
            className={cn(
              "text-sm text-[var(--l-text)] leading-relaxed",
              !captionExpanded && "line-clamp-2",
            )}
          >
            <Link
              href={profileUrl}
              className="mr-1 font-bold hover:underline"
            >
              {displayName}
            </Link>
            {renderCaption(post.caption, onHashtagClick)}
          </p>
          {!captionExpanded && post.caption.length > 100 && (
            <button
              onClick={() => setCaptionExpanded(true)}
              className="mt-0.5 text-sm font-medium text-[var(--l-text-muted)] hover:text-[var(--l-text)] transition-colors"
            >
              more
            </button>
          )}
        </div>
      )}

      {/* ─── 5. COMMENT PREVIEW ─── */}
      {targetPost._count.comments > 0 && (
        <div className="px-4 pb-3">
          <button
            onClick={onOpenModal}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            View all {targetPost._count.comments} comment{targetPost._count.comments !== 1 ? "s" : ""}
          </button>
        </div>
      )}

      {/* Bottom padding when no comments */}
      {targetPost._count.comments === 0 && <div className="pb-3" />}

      {/* ─── HEART BURST KEYFRAMES (injected via style tag) ─── */}
      <style jsx global>{`
        @keyframes heart-burst {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
          60% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        .animate-heart-burst {
          animation: heart-burst 0.8s ease-out forwards;
        }
      `}</style>
    </article>
  );
}
