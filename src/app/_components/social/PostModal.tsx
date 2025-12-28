"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import {
  Loader2,
  Heart,
  Bookmark,
  Send,
  ChevronLeft,
  ChevronRight,
  Share2,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Flag,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCreatePostModal } from "@/stores/createPostModal";
import { formatDistanceToNow } from "date-fns";

import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

import { ReportModal } from "@/app/_components/modals/ReportModal";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type PostSnapshot =
  RouterOutputs["post"]["getTrending"]["posts"][number];

const PostModal = ({
  posts,
  initialIndex,
  onClose,
}: {
  posts: PostSnapshot[];
  initialIndex: number;
  onClose?: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const safeIndex =
    currentIndex >= 0 && currentIndex < posts.length ? currentIndex : 0;
  const postStub = posts[safeIndex];
  const postId = postStub?.id;

  const { user } = useAuth();
  const utils = api.useUtils();
  const createPostModal = useCreatePostModal();

  const {
    data: post,
    isLoading,
    isError,
  } = api.post.getById.useQuery({ id: postId ?? "" }, { enabled: !!postId });

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  }, [posts.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  }, [posts.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  const handleShare = async () => {
    if (!postId) return;
    const url = `${window.location.origin}/post/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy link.");
    }
  };

  const deletePostMutation = api.post.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deleted");
      if (onClose) onClose();
      void utils.post.getTrending.invalidate();
      if (user?.username) {
        void utils.post.getForUser.invalidate({ username: user.username });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = () => {
    if (!post) return;
    if (confirm("Delete this post?"))
      deletePostMutation.mutate({ postId: post.id });
  };

  const likeMutation = api.post.like.useMutation({
    onMutate: async ({ postId }) => {
      await utils.post.getById.cancel({ id: postId });
      const prev = utils.post.getById.getData({ id: postId });
      if (prev) {
        utils.post.getById.setData(
          { id: postId },
          {
            ...prev,
            _count: { ...prev._count, likes: prev._count.likes + 1 },
            viewer: { ...prev.viewer, hasLiked: true },
          },
        );
      }
      return { prev };
    },
    onError: (err, __, ctx) =>
      ctx?.prev && utils.post.getById.setData({ id: postId! }, ctx.prev),
    onSettled: (d, e, { postId }) =>
      void utils.post.getById.invalidate({ id: postId }),
  });

  const unlikeMutation = api.post.unlike.useMutation({
    onMutate: async ({ postId }) => {
      await utils.post.getById.cancel({ id: postId });
      const prev = utils.post.getById.getData({ id: postId });
      if (prev) {
        utils.post.getById.setData(
          { id: postId },
          {
            ...prev,
            _count: { ...prev._count, likes: prev._count.likes - 1 },
            viewer: { ...prev.viewer, hasLiked: false },
          },
        );
      }
      return { prev };
    },
    onError: (err, __, ctx) =>
      ctx?.prev && utils.post.getById.setData({ id: postId! }, ctx.prev),
    onSettled: (d, e, { postId }) =>
      void utils.post.getById.invalidate({ id: postId }),
  });

  const isLiked = post?.viewer?.hasLiked ?? false;
  const isBookmarked = post?.viewer?.hasBookmarked ?? false;

  const handleLike = () => {
    if (!user) {
      toast.error("Login required");
      return;
    }
    if (!postId) return;

    if (isLiked) {
      unlikeMutation.mutate({ postId });
    } else {
      likeMutation.mutate({ postId });
    }
  };

  const activePost = post ?? postStub;
  if (!activePost) return null;

  const author = activePost.author;
  const isVendor = author.role === "VENDOR";
  const avatarUrl = isVendor
    ? author.vendorProfile?.avatarUrl
    : author.clientProfile?.avatarUrl;
  const displayName =
    (isVendor
      ? author.vendorProfile?.companyName
      : author.clientProfile?.name) ?? author.username;
  const profileUrl = `/${isVendor ? "v" : "c"}/${author.username}`;
  const isAuthor = user?.id === author.id;

  return (
    <>
      {/* FIX: Wrapped in Fragment so ReportModal is a sibling, not a child.
        This prevents clicks in ReportModal from bubbling up to the onClick={onClose} handler.
      */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-0 backdrop-blur-sm md:p-4 lg:p-8"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-[110] rounded-full bg-zinc-800 p-2 text-white shadow-md transition-transform hover:scale-110 hover:bg-zinc-900 md:top-5 md:right-5"
          aria-label="Close modal"
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <div
          className="flex h-full w-full max-w-7xl flex-col overflow-hidden bg-white shadow-2xl md:h-[85vh] md:rounded-2xl lg:flex-row"
          onClick={(e) => e.stopPropagation()}
        >
          {/* --- LEFT: MEDIA STAGE --- */}
          <div className="relative flex h-[40vh] w-full items-center justify-center bg-gray-50 lg:h-full lg:w-[65%] xl:w-[70%]">
            {activePost.assets[0] && (
              <div className="relative h-full w-full">
                <Image
                  src={activePost.assets[0].url}
                  alt={activePost.caption ?? "Post content"}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            )}

            {posts.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-md transition hover:bg-white hover:text-gray-900"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-md transition hover:bg-white hover:text-gray-900"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* --- RIGHT: SIDEBAR --- */}
          <div className="flex flex-1 flex-col border-l border-gray-100 bg-white lg:w-[35%] xl:w-[30%]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <Link href={profileUrl} className="group flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-50">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">
                      {displayName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-gray-900 group-hover:underline">
                      {displayName}
                    </span>
                    {isVendor && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">@{author.username}</p>
                </div>
              </Link>

              {user && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="z-[200] w-40 p-1" align="end">
                    {isAuthor ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          disabled={!post}
                          onClick={() => post && createPostModal.onOpen(post)}
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-red-600 hover:text-red-700"
                          disabled={!post}
                          onClick={handleDelete}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-600 hover:text-red-700"
                        onClick={() => setIsReportOpen(true)}
                      >
                        <Flag className="mr-2 h-3.5 w-3.5" /> Report
                      </Button>
                    )}
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Body */}
            <div className="scrollbar-thin scrollbar-thumb-gray-200 flex-1 overflow-y-auto p-5">
              <div className="mb-6">
                {activePost.caption && (
                  <h1 className="mb-2 text-xl leading-snug font-bold text-gray-900">
                    {activePost.caption}
                  </h1>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>
                    Posted{" "}
                    {formatDistanceToNow(
                      new Date(activePost.createdAt || new Date()),
                      { addSuffix: true },
                    )}
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {activePost._count.likes}
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-gray-300" />
                </div>
              ) : (
                <div className="space-y-5">
                  <h3 className="border-b border-gray-100 pb-2 text-sm font-semibold text-gray-900">
                    Comments ({post?._count.comments ?? 0})
                  </h3>
                  {post?.comments?.length === 0 && (
                    <p className="text-sm text-gray-400 italic">
                      No comments yet.
                    </p>
                  )}
                  {post?.comments?.map((comment) => {
                    const cAuthor = comment.author;
                    const cAvatar =
                      cAuthor.role === "VENDOR"
                        ? cAuthor.vendorProfile?.avatarUrl
                        : cAuthor.clientProfile?.avatarUrl;
                    const cName =
                      (cAuthor.role === "VENDOR"
                        ? cAuthor.vendorProfile?.companyName
                        : cAuthor.clientProfile?.name) ?? cAuthor.username;

                    return (
                      <div key={comment.id} className="flex gap-3">
                        <Link
                          href={`/${cAuthor.role === "VENDOR" ? "v" : "c"}/${cAuthor.username}`}
                          className="shrink-0"
                        >
                          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gray-100">
                            {cAvatar ? (
                              <Image
                                src={cAvatar}
                                alt=""
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px]">
                                {cName[0]}
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <Link
                              href={`/${cAuthor.role === "VENDOR" ? "v" : "c"}/${cAuthor.username}`}
                              className="text-sm font-semibold text-gray-900 hover:underline"
                            >
                              {cName}
                            </Link>
                            <span className="text-[10px] text-gray-400">
                              {formatDistanceToNow(
                                new Date(comment.createdAt),
                                {
                                  addSuffix: true,
                                },
                              )}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm leading-relaxed text-gray-700">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-gray-50/50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "gap-2 rounded-full border-gray-200 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600",
                      isLiked && "border-pink-200 bg-pink-50 text-pink-600",
                    )}
                    onClick={handleLike}
                  >
                    <Heart
                      className={cn("h-4 w-4", isLiked && "fill-current")}
                    />
                    {activePost._count.likes}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-full border-gray-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "text-gray-400 hover:text-yellow-500",
                    isBookmarked && "fill-current text-yellow-500",
                  )}
                >
                  <Bookmark className="h-5 w-5" />
                </Button>
              </div>
              {user && postId && <AddCommentForm postId={postId} />}
            </div>
          </div>
        </div>
      </div>

      {/* --- REPORT MODAL SIBLING --- */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetPostId={activePost.id}
      />
    </>
  );
};

// --- COMMENT FORM ---
const AddCommentForm = ({ postId }: { postId: string }) => {
  const [text, setText] = useState("");
  const utils = api.useUtils();

  const addCommentMutation = api.post.addComment.useMutation({
    onSuccess: () => {
      setText("");
      void utils.post.getById.invalidate({ id: postId });
    },
    onError: () => toast.error("Failed to post comment"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addCommentMutation.mutate({ postId, text });
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <input
        type="text"
        placeholder="Write a comment..."
        className="w-full rounded-full border border-gray-200 bg-white py-2.5 pr-12 pl-4 text-sm outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={addCommentMutation.isPending}
      />
      <button
        type="submit"
        disabled={!text.trim() || addCommentMutation.isPending}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-pink-600 hover:bg-pink-50 disabled:opacity-50"
      >
        {addCommentMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
    </form>
  );
};

export default PostModal;
