"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "@/trpc/react";
import {
  Loader2,
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  onClose: () => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const postId = posts[currentIndex]?.id;

  const { user } = useAuth();
  const utils = api.useUtils();

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
  const avatarUrl =
    post?.author.vendorProfile?.avatarUrl ??
    post?.author.clientProfile?.avatarUrl;
  const displayName = post?.author.username;

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

  const authorProfile = post.author.vendorProfile ?? post.author.clientProfile;

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
      </div>
      {/* Content Section */}
      <div className="flex min-h-0 w-full flex-grow flex-col lg:w-1/4">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center">
            {/* <Image
              src={authorProfile?.avatarUrl ?? ""}
              className="mr-3 h-10 w-10 rounded-full"
              alt="User avatar"
              width={40}
              height={40}
            /> */}
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                className="mr-3 h-10 w-10 rounded-full"
                alt="User avatar"
                width={40}
                height={40}
              />
            ) : (
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-pink-200 font-semibold text-pink-600">
                {displayName?.charAt(0).toUpperCase() ?? "C"}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-800">{post.author.username}</p>
              <p className="text-xs text-gray-500">{authorProfile?.location}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-3xl leading-none text-gray-500 hover:text-gray-800"
          >
            &times;
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4">
          <p className="mb-6 text-gray-700">{post.caption}</p>
          {/* Comments Section */}
          <h3 className="mb-4 font-bold text-gray-800">Comments</h3>
          <div className="space-y-4">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex items-start">
                {/* <Image
                  src={
                    comment.author.vendorProfile?.avatarUrl ??
                    comment.author.clientProfile?.avatarUrl ??
                    ""
                  }
                  className="mr-3 h-8 w-8 rounded-full"
                  alt="Commenter avatar"
                  width={32}
                  height={32}
                /> */}
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    className="mr-3 h-8 w-8 rounded-full"
                    alt="Commenter avatar"
                    width={32}
                    height={32}
                  />
                ) : (
                  <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-pink-200 font-semibold text-pink-600">
                    {displayName?.charAt(0).toUpperCase() ?? "C"}
                  </div>
                )}
                <div>
                  <p className="text-sm">
                    <span className="font-bold text-gray-800">
                      {comment.author.username}
                    </span>{" "}
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}
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
