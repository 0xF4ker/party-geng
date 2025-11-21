"use client";

import { api } from "@/trpc/react";
import { Loader2, Clapperboard } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import PostModal from "@/app/_components/social/PostModal";
import { useUiStore } from "@/stores/ui";

const TrendingPage = () => {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.post.getTrending.useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(
    null,
  );

  const { headerHeight } = useUiStore();

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center text-red-500">
        <p>Error loading posts. Please try again later.</p>
      </div>
    );
  }

  const allPosts = data?.pages.flatMap((page) => page.posts);

  if (!allPosts || allPosts.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-lg bg-gray-50 text-center">
        <Clapperboard className="h-12 w-12 text-gray-400" />
        <p className="mt-4 font-semibold text-gray-700">No posts yet</p>
        <p className="text-sm text-gray-500">
          Come back later to see trending posts!
        </p>
      </div>
    );
  }

  return (
    <div>
      <section
        className="border-b border-gray-200 bg-white py-12 shadow-sm"
        style={{ marginTop: headerHeight }}
      >
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-gray-800">#Trending</h1>
          <p className="mt-2 text-gray-600">
            Explore the most popular posts from the PartyGeng community.
          </p>
        </div>
      </section>
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="columns-1 gap-6 sm:columns-2 md:columns-3">
            {allPosts.map((post, index) => (
              <div
                key={post.id}
                className="mb-6 break-inside-avoid"
                onClick={() => setSelectedPostIndex(index)}
              >
                <div className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg shadow-md transition-shadow hover:shadow-xl">
                  {post.assets[0] && (
                    <Image
                      src={post.assets[0].url}
                      alt={post.caption ?? "Trending post"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          {hasNextPage && (
            <div className="mt-12 text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-full bg-purple-600 px-8 py-3 font-semibold text-white transition hover:bg-purple-700"
              >
                {isFetchingNextPage ? "Loading..." : "Load More Posts"}
              </button>
            </div>
          )}
        </div>
      </section>

      {selectedPostIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedPostIndex(null)}
        >
          <PostModal
            posts={allPosts}
            initialIndex={selectedPostIndex}
            onClose={() => setSelectedPostIndex(null)}
          />
        </div>
      )}
    </div>
  );
};

export default TrendingPage;
