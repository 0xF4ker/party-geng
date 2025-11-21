"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import { Loader2, Heart, MessageCircle, Bookmark, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const PostPage = () => {
  const params = useParams();
  const postId = params.id as string;
  const { user } = useAuth();
  const utils = api.useUtils();

  const {
    data: post,
    isLoading,
    isError,
  } = api.post.getById.useQuery({ id: postId });

  const likeMutation = api.post.like.useMutation({
    onSuccess: () => {
      void utils.post.getById.invalidate({ id: postId });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    },
  });

  const unlikeMutation = api.post.unlike.useMutation({
    onSuccess: () => {
      void utils.post.getById.invalidate({ id: postId });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    },
  });

  const bookmarkMutation = api.post.bookmark.useMutation({
    onSuccess: () => {
      void utils.post.getById.invalidate({ id: postId });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    },
  });

  const removeBookmarkMutation = api.post.removeBookmark.useMutation({
    onSuccess: () => {
      void utils.post.getById.invalidate({ id: postId });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    },
  });

  const isLiked = post?.viewer.hasLiked ?? false;
  const isBookmarked = post?.viewer.hasBookmarked ?? false;

  const handleLike = () => {
    if (!user) {
      void toast.info("Please log in to like posts.");
      return;
    }
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
    if (isBookmarked) {
      removeBookmarkMutation.mutate({ postId });
    } else {
      bookmarkMutation.mutate({ postId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        <p>Post not found or could not be loaded.</p>
      </div>
    );
  }

  const authorProfile = post.author.vendorProfile ?? post.author.clientProfile;

  return (
    <div className="bg-white">
      <div className="container mx-auto max-w-4xl py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-8">
          {/* Post Assets */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
            {post.assets.length > 0 && (
              <Image
                src={post.assets[0]?.url ?? ""}
                alt={post.caption ?? "Post image"}
                fill
                className="object-cover"
              />
            )}
          </div>

          {/* Post Details & Comments */}
          <div className="flex flex-col pt-4 md:pt-0">
            {/* Author Info */}
            <div className="flex items-center gap-3 border-b pb-4">
              <Link
                href={`/${post.author.role === "VENDOR" ? "v" : "c"}/${post.author.username}`}
              >
                <Image
                  src={authorProfile?.avatarUrl ?? "/default-avatar.png"}
                  alt={post.author.username}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </Link>
              <div>
                <Link
                  href={`/${post.author.role === "VENDOR" ? "v" : "c"}/${post.author.username}`}
                  className="font-semibold hover:underline"
                >
                  {post.author.username}
                </Link>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(post.createdAt)} ago
                </p>
              </div>
            </div>

            <div className="grow overflow-y-auto py-4">
              {/* Caption */}
              {post.caption && <p className="mb-4 text-sm">{post.caption}</p>}

              {/* Comments */}
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <Image
                      src={
                        comment.author.clientProfile?.avatarUrl ??
                        comment.author.vendorProfile?.avatarUrl ??
                        "/default-avatar.png"
                      }
                      alt={comment.author.username}
                      width={32}
                      height={32}
                      className="mt-1 rounded-full"
                    />
                    <div>
                      <p className="text-sm">
                        <Link
                          href={`/${comment.author.role === "VENDOR" ? "v" : "c"}/${comment.author.username}`}
                          className="font-semibold hover:underline"
                        >
                          {comment.author.username}
                        </Link>{" "}
                        {comment.text}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatDistanceToNow(comment.createdAt)}</span>
                        <button className="font-semibold">Reply</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions & Comment Form */}
            <div className="mt-auto border-t pt-4">
              <div className="flex items-center justify-between">
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

              {user && <AddCommentForm postId={postId} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddCommentForm = ({ postId }: { postId: string }) => {
  const [text, setText] = useState("");
  const utils = api.useUtils();

  const addCommentMutation = api.post.addComment.useMutation({
    onSuccess: () => {
      setText("");
      void utils.post.getById.invalidate({ id: postId });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error("Failed to post comment", { description: error.message });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addCommentMutation.mutate({ postId, text });
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

export default PostPage;
