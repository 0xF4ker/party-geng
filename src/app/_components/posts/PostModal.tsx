"use client";

import Image from "next/image";
import { api } from "@/trpc/react";
import { Loader2, Send } from "lucide-react";

const PostModal = ({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) => {
  const {
    data: post,
    isLoading,
    isError,
  } = api.post.getById.useQuery({ id: postId });

  // Mutations for like, unlike, bookmark, etc. would go here, similar to PostPage
  // For brevity, they are omitted, but would be implemented with optimistic updates

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
      className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl lg:flex-row"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Media Section */}
      <div className="relative flex w-full items-center justify-center bg-gray-900 lg:w-2/3">
        {post.assets.length > 0 && (
          <Image
            src={post.assets[0]?.url ?? ""}
            alt={post.caption ?? "Post image"}
            fill
            className="object-contain"
          />
        )}
      </div>
      {/* Content Section */}
      <div className="flex w-full flex-col lg:w-1/3">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center">
            <Image
              src={authorProfile?.avatarUrl ?? ""}
              className="mr-3 h-10 w-10 rounded-full"
              alt="User avatar"
              width={40}
              height={40}
            />
            <div>
              <p className="font-bold text-gray-800">{post.author.username}</p>
              <p className="text-xs text-gray-500">
                {
                  (
                    authorProfile?.location as unknown as {
                      display_name: string;
                    }
                  )?.display_name
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-3xl leading-none text-gray-500 hover:text-gray-800"
          >
            &times;
          </button>
        </div>
        <div className="grow overflow-y-auto p-4">
          <p className="mb-6 text-gray-700">{post.caption}</p>
          {/* Comments Section */}
          <h3 className="mb-4 font-bold text-gray-800">Comments</h3>
          <div className="space-y-4">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex items-start">
                <Image
                  src={
                    comment.author.vendorProfile?.avatarUrl ??
                    comment.author.clientProfile?.avatarUrl ??
                    ""
                  }
                  className="mr-3 h-8 w-8 rounded-full"
                  alt="Commenter avatar"
                  width={32}
                  height={32}
                />
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
          <div className="relative">
            <input
              type="text"
              placeholder="Add a comment..."
              className="w-full rounded-full border border-gray-300 py-2 pr-10 focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />
            <button className="absolute top-1/2 right-3 -translate-y-1/2 text-pink-500 hover:text-pink-700">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
