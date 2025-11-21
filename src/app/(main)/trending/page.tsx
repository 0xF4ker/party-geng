"use client";

import { api } from "@/trpc/react";
import { Loader2, Clapperboard, Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";

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
    }
  );

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
        <div className="text-center h-48 flex flex-col justify-center items-center bg-gray-50 rounded-lg">
            <Clapperboard className="w-12 h-12 text-gray-400" />
            <p className="mt-4 font-semibold text-gray-700">No posts yet</p>
            <p className="text-sm text-gray-500">Come back later to see trending posts!</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Trending Posts</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data?.pages.map((group, i) => (
          <Fragment key={i}>
            {group.posts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}`}>
                <div className="group relative aspect-square overflow-hidden rounded-lg shadow-md transition-shadow hover:shadow-xl">
                  {post.assets[0] && (
                    <Image
                      src={post.assets[0].url}
                      alt={post.caption ?? "Trending post"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex items-center gap-x-4 text-white">
                          <div className="flex items-center gap-1">
                              <Heart className="h-5 w-5"/>
                              <span>{post._count.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                              <MessageCircle className="h-5 w-5"/>
                              <span>{post._count.comments}</span>
                          </div>
                      </div>
                  </div>
                </div>
              </Link>
            ))}
          </Fragment>
        ))}
      </div>
      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-full bg-pink-600 px-6 py-2 font-semibold text-white transition hover:bg-pink-700 disabled:bg-gray-400"
          >
            {isFetchingNextPage ? "Loading more..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default TrendingPage;
