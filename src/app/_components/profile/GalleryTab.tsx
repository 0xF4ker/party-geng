"use client";

import { api } from "@/trpc/react";
import { Loader2, Clapperboard, Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import PostModal, {
  type PostSnapshot,
} from "@/app/_components/social/PostModal";

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
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
        <div className="mb-3 rounded-full bg-white p-4 shadow-sm">
          <Clapperboard className="h-8 w-8 text-gray-400" />
        </div>
        <p className="font-semibold text-gray-900">Gallery Empty</p>
        <p className="mt-1 max-w-[200px] text-sm text-gray-500">
          This user hasn&apos;t showcased any work yet.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Masonry Layout Container */}
      <div className="columns-2 gap-4 space-y-4 md:columns-3 lg:columns-4">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="group relative cursor-pointer break-inside-avoid"
            onClick={() => setSelectedPostIndex(index)}
          >
            <div className="relative overflow-hidden rounded-xl bg-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
              {post.assets[0] ? (
                <Image
                  src={post.assets[0].url}
                  alt={post.caption ?? "Gallery image"}
                  width={500}
                  height={500}
                  className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  priority={index < 4}
                />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center bg-gray-200">
                  <Clapperboard className="h-8 w-8 text-gray-400" />
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex items-center gap-3 text-white">
                  <div className="flex items-center gap-1.5 rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">
                    <Heart className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">
                      {post._count.likes}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">
                      {post._count.comments}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPostIndex !== null && (
        <div className="relative z-[100]">
          {/* We cast 'posts' here because inferRouterOutputs might treat 
              getForUser result slightly differently than getTrending, 
              but the shapes are identical in practice. */}
          <PostModal
            posts={posts as PostSnapshot[]}
            initialIndex={selectedPostIndex}
            onClose={() => setSelectedPostIndex(null)}
          />
        </div>
      )}
    </>
  );
};
