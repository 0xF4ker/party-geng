"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import {
  Loader2,
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  ChevronLeft,
  ChevronRight,
  Share2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCreatePostModal } from "@/stores/createPostModal";

type Post = {
  id: string;
  caption: string | null;
  assets: { url: string }[];
};

const PostModal = ({
  posts,
  initialIndex,
  onClose,
}: {
  posts: Post[];
  initialIndex: number;
  onClose?: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const postId = posts[currentIndex]?.id;

  const { user } = useAuth();
  const utils = api.useUtils();
  const createPostModal = useCreatePostModal();

  const {
    data: post,
    isLoading,
    isError,
  } = api.post.getById.useQuery({ id: postId ?? "" }, { enabled: !!postId });

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
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
    onError: (err) => {
      toast.error("Failed to delete post", { description: err.message });
    },
  });

  const handleDelete = () => {
    if (!post) return;
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate({ postId: post.id });
    }
  };

  const likeMutation = api.post.like.useMutation({
    onMutate: async ({ postId }) => {
      await utils.post.getById.cancel({ id: postId });
      const previousPost = utils.post.getById.getData({ id: postId });
      if (previousPost) {
        utils.post.getById.setData(
          { id: postId },
          {
            ...previousPost,
            _count: {
              ...previousPost._count,
              likes: previousPost._count.likes + 1,
            },
            viewer: {
              ...previousPost.viewer,
              hasLiked: true,
            },
          },
        );
      }
      return { previousPost };
    },
    onError: (err, { postId }, context) => {
      if (context?.previousPost) {
        utils.post.getById.setData({ id: postId }, context.previousPost);
      }
      toast.error("Failed to like post.");
    },
    onSettled: (data, error, { postId }) => {
      void utils.post.getById.invalidate({ id: postId });
    },
  });

  const unlikeMutation = api.post.unlike.useMutation({
    onMutate: async ({ postId }) => {
      await utils.post.getById.cancel({ id: postId });
      const previousPost = utils.post.getById.getData({ id: postId });
      if (previousPost) {
        utils.post.getById.setData(
          { id: postId },
          {
            ...previousPost,
            _count: {
              ...previousPost._count,
              likes: previousPost._count.likes - 1,
            },
            viewer: {
              ...previousPost.viewer,
              hasLiked: false,
            },
          },
        );
      }
      return { previousPost };
    },
    onError: (err, { postId }, context) => {
      if (context?.previousPost) {
        utils.post.getById.setData({ id: postId }, context.previousPost);
      }
      toast.error("Failed to unlike post.");
    },
    onSettled: (data, error, { postId }) => {
      void utils.post.getById.invalidate({ id: postId });
    },
  });

  const bookmarkMutation = api.post.bookmark.useMutation({
    onMutate: async ({ postId }) => {
      await utils.post.getById.cancel({ id: postId });
      const previousPost = utils.post.getById.getData({ id: postId });
      if (previousPost) {
        utils.post.getById.setData(
          { id: postId },
          {
            ...previousPost,
            viewer: {
              ...previousPost.viewer,
              hasBookmarked: true,
            },
          },
        );
      }
      return { previousPost };
    },
    onError: (err, { postId }, context) => {
      if (context?.previousPost) {
        utils.post.getById.setData({ id: postId }, context.previousPost);
      }
      toast.error("Failed to bookmark post.");
    },
    onSettled: (data, error, { postId }) => {
      void utils.post.getById.invalidate({ id: postId });
    },
  });

  const removeBookmarkMutation = api.post.removeBookmark.useMutation({
    onMutate: async ({ postId }) => {
      await utils.post.getById.cancel({ id: postId });
      const previousPost = utils.post.getById.getData({ id: postId });
      if (previousPost) {
        utils.post.getById.setData(
          { id: postId },
          {
            ...previousPost,
            viewer: {
              ...previousPost.viewer,
              hasBookmarked: false,
            },
          },
        );
      }
      return { previousPost };
    },
    onError: (err, { postId }, context) => {
      if (context?.previousPost) {
        utils.post.getById.setData({ id: postId }, context.previousPost);
      }
      toast.error("Failed to remove bookmark.");
    },
    onSettled: (data, error, { postId }) => {
      void utils.post.getById.invalidate({ id: postId });
    },
  });

  const isLiked = post?.viewer.hasLiked ?? false;
  const isBookmarked = post?.viewer.hasBookmarked ?? false;

  const handleLike = () => {
    if (!user) {
      void toast.info("Please log in to like posts.");
      return;
    }
    if (!postId) return;
    if (isLiked) {
      unlikeMutation.mutate({ postId });
    } else {
      likeMutation.mutate({ postId });
    }
  };

  const handleBookmark = () => {
    if (!user) {
      void toast.info("Please log in to bookmark posts.");
      return;
    }
    if (!postId) return;
    if (isBookmarked) {
      removeBookmarkMutation.mutate({ postId });
    } else {
      bookmarkMutation.mutate({ postId });
    }
  };

  const handleShare = () => {
    if (!postId) return;
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url).then(
      () => {
        toast.success("Link copied to clipboard!");
      },
      (err) => {
        console.error("Failed to copy: ", err);
        toast.error("Failed to copy link.");
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        <p>Post not found or could not be loaded.</p>
      </div>
    );
  }

  const author = post.author;
  const authorAvatarUrl =
    author.role === "VENDOR"
      ? author.vendorProfile?.avatarUrl
      : author.clientProfile?.avatarUrl;
  const authorDisplayName =
    (author.role === "VENDOR"
      ? author.vendorProfile?.companyName
      : author.clientProfile?.name) ?? author.username;
  const authorProfileUrl = `/${author.role === "VENDOR" ? "v" : "c"}/${
    author.username
  }`;

  const isAuthor = user?.id === post.author.id;

  return (
    <div
      className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl lg:flex-row"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Media Section */}
      <div className="relative flex h-3/5 w-full items-center justify-center bg-gray-900 lg:h-full lg:w-3/4">
        {post.assets.length > 0 && (
          <Image
            src={post.assets[0]?.url ?? ""}
            alt={post.caption ?? "Post image"}
            fill
            className="object-contain"
          />
        )}
        {posts.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="modal-nav-btn absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              onClick={handleNext}
              className="modal-nav-btn absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </>
        )}
      </div>
      {/* Content Section */}
      <div className="flex min-h-0 w-full grow flex-col lg:w-1/4">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <Link
            href={authorProfileUrl}
            className="group/user flex min-w-0 items-center gap-3"
          >
            {authorAvatarUrl ? (
              <Image
                src={authorAvatarUrl}
                className="h-10 w-10 rounded-full"
                alt="User avatar"
                width={40}
                height={40}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-200 font-semibold text-pink-600">
                {authorDisplayName?.charAt(0).toUpperCase() ?? "C"}
              </div>
            )}
            <div className="truncate">
              <p className="font-bold text-gray-800 group-hover/user:underline">
                {authorDisplayName}
              </p>
              <p className="truncate text-xs text-gray-500">
                {author.vendorProfile?.location ??
                  author.clientProfile?.location}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {isAuthor && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40">
                  <div className="grid gap-4">
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => createPostModal.onOpen(post)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-red-500 hover:text-red-600"
                      onClick={handleDelete}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="text-3xl leading-none text-gray-500 hover:text-gray-800"
              >
                &times;
              </button>
            )}
          </div>
        </div>
        <div className="grow overflow-y-auto p-4">
          <p className="mb-6 text-gray-700">{post.caption}</p>
          {/* Comments Section */}
          <h3 className="mb-4 font-bold text-gray-800">Comments</h3>
          <div className="space-y-4">
            {post.comments.map((comment) => {
              const commenter = comment.author;
              const commenterAvatarUrl =
                commenter.role === "VENDOR"
                  ? commenter.vendorProfile?.avatarUrl
                  : commenter.clientProfile?.avatarUrl;
              const commenterDisplayName =
                (commenter.role === "VENDOR"
                  ? commenter.vendorProfile?.companyName
                  : commenter.clientProfile?.name) ?? commenter.username;
              const commenterProfileUrl = `/${
                commenter.role === "VENDOR" ? "v" : "c"
              }/${commenter.username}`;

              return (
                <div key={comment.id} className="flex items-start gap-3">
                  <Link href={commenterProfileUrl} className="shrink-0">
                    {commenterAvatarUrl ? (
                      <Image
                        src={commenterAvatarUrl}
                        className="h-8 w-8 rounded-full"
                        alt="Commenter avatar"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-200 text-xs font-semibold text-pink-600">
                        {commenterDisplayName?.charAt(0).toUpperCase() ?? "A"}
                      </div>
                    )}
                  </Link>
                  <div>
                    <p className="text-sm">
                      <Link
                        href={commenterProfileUrl}
                        className="font-bold text-gray-800 hover:underline"
                      >
                        {commenterDisplayName}
                      </Link>{" "}
                      {comment.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t border-gray-200 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 transition-colors hover:text-pink-500"
              >
                <Heart
                  className={cn(
                    "h-6 w-6",
                    isLiked && "fill-current text-red-500",
                  )}
                />
                <span>{post._count.likes}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 transition-colors hover:text-blue-500"
              >
                <Share2 className="h-6 w-6" />,{" "}
              </button>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                <span>{post._count.comments}</span>
              </div>
            </div>
            <button onClick={handleBookmark}>
              <Bookmark
                className={cn(
                  "h-6 w-6",
                  isBookmarked && "fill-current text-yellow-500",
                )}
              />
            </button>
          </div>
          {user && postId && <AddCommentForm postId={postId} />}
        </div>
      </div>
    </div>
  );
};

const AddCommentForm = ({ postId }: { postId: string }) => {
  const [text, setText] = useState("");
  const utils = api.useUtils();
  const { user } = useAuth();

  const addCommentMutation = api.post.addComment.useMutation({
    onMutate: async ({ text }) => {
      await utils.post.getById.cancel({ id: postId });
      const previousPost = utils.post.getById.getData({ id: postId });

      if (previousPost && user) {
        const newComment = {
          id: `temp-${Date.now()}`,
          text,
          createdAt: new Date(),
          postId: postId,
          authorId: user.id,
          parentId: null,
          author: {
            id: user.id,
            username: user.username,
            clientProfile: user.clientProfile,
            vendorProfile: user.vendorProfile,
            role: user.role,
          },
        };

        utils.post.getById.setData(
          { id: postId },
          {
            ...previousPost,
            comments: [...previousPost.comments, newComment],
            _count: {
              ...previousPost._count,
              comments: previousPost._count.comments + 1,
            },
          },
        );
      }
      return { previousPost };
    },
    onError: (err, { postId }, context) => {
      if (context?.previousPost) {
        utils.post.getById.setData({ id: postId }, context.previousPost);
      }
      toast.error("Failed to post comment.");
    },
    onSettled: () => {
      void utils.post.getById.invalidate({ id: postId });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addCommentMutation.mutate({ postId, text });
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
      <Textarea
        placeholder="Add a comment..."
        className="h-10 grow resize-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={addCommentMutation.isPending}
      />
      <Button
        type="submit"
        size="icon"
        disabled={addCommentMutation.isPending || !text.trim()}
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
};

export default PostModal;
