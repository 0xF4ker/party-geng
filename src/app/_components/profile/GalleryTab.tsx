"use client";

import { api } from "@/trpc/react";
import { Loader2, Clapperboard, Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import PostModal from "@/app/_components/social/PostModal";

type GalleryTabProps = {
  username: string;
};

export const GalleryTab = ({ username }: GalleryTabProps) => {
  const { data: posts, isLoading } = api.post.getForUser.useQuery({ username });
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-lg bg-gray-50 text-center">
        <Clapperboard className="h-12 w-12 text-gray-400" />
        <p className="mt-4 font-semibold text-gray-700">No posts yet</p>
        <p className="text-sm text-gray-500">
          This user hasn&apos;t shared any posts in their gallery.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 md:columns-3">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="mb-4 break-inside-avoid"
            onClick={() => setSelectedPostIndex(index)}
          >
            <div className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg shadow-md transition-shadow hover:shadow-xl">
              {post.assets[0] ? (
                <Image
                  src={post.assets[0].url}
                  alt={post.caption ?? "Post image"}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-gray-200"></div>
              )}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex items-center gap-4 text-white">
                  <div className="flex items-center gap-1">
                    <Heart size={16} />
                    <span>{post._count.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={16} />
                    <span>{post._count.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPostIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedPostIndex(null)}
        >
          <PostModal
            posts={posts}
            initialIndex={selectedPostIndex}
            onClose={() => setSelectedPostIndex(null)}
          />
        </div>
      )}
    </>
  );
};
