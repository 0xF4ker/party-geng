"use client";

import { api } from "@/trpc/react";
import { Loader2, Clapperboard } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type GalleryTabProps = {
  username: string;
};

export const GalleryTab = ({ username }: GalleryTabProps) => {
  const { data: posts, isLoading } = api.post.getForUser.useQuery({ username });
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center h-48 flex flex-col justify-center items-center bg-gray-50 rounded-lg">
        <Clapperboard className="w-12 h-12 text-gray-400" />
        <p className="mt-4 font-semibold text-gray-700">No posts yet</p>
        <p className="text-sm text-gray-500">This user hasn&apos;t shared any posts in their gallery.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="relative aspect-square cursor-pointer group overflow-hidden rounded-md"
          onClick={() => router.push(`/post/${post.id}`)}
        >
          {post.assets[0] ? (
             <Image
                src={post.assets[0].url}
                alt={post.caption ?? "Post image"}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
             />
          ): (
            <div className="w-full h-full bg-gray-200"></div>
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      ))}
    </div>
  );
};
