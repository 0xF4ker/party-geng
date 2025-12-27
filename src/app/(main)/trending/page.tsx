"use client";

import { api } from "@/trpc/react";
import {
  Loader2,
  Heart,
  MessageCircle,
  Clapperboard,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import PostModal from "@/app/_components/social/PostModal";
import { useUiStore } from "@/stores/ui";
import { useInView } from "react-intersection-observer"; // Optional: simplified hook, but I'll write raw observer to keep dependencies low if you prefer.
import { useIntersectionObserver } from "usehooks-ts";
export default function TrendingPage() {
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

  // --- Infinite Scroll Setup ---
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  }) as { ref: (node?: Element | null) => void; inView: boolean };

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

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
      <div className="mt-20 flex flex-col items-center justify-center text-center">
        <div className="rounded-full bg-gray-100 p-6">
          <Clapperboard className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-gray-700">
          No posts yet
        </h2>
        <p className="text-gray-500">Check back later for trending content!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <section
        className="border-b border-gray-100 bg-white py-8"
        style={{ marginTop: headerHeight }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Showcases
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Discover top rated vendors and trending events.
          </p>
        </div>
      </section>

      {/* Masonry Grid */}
      <section className="container mx-auto px-4 py-6 md:px-6">
        <div className="columns-2 gap-4 space-y-4 md:columns-3 lg:columns-4 xl:columns-5">
          {allPosts.map((post, index) => {
            const author = post.author;
            const isVendor = author.role === "VENDOR";

            // Resolve Author Details
            const avatarUrl = isVendor
              ? author.vendorProfile?.avatarUrl
              : author.clientProfile?.avatarUrl;

            const displayName =
              (isVendor
                ? author.vendorProfile?.companyName
                : author.clientProfile?.name) ?? author.username;

            const profileUrl = `/${isVendor ? "v" : "c"}/${author.username}`;

            return (
              <div
                key={post.id}
                className="group relative cursor-pointer break-inside-avoid"
                onClick={() => setSelectedPostIndex(index)}
              >
                {/* --- CARD IMAGE AREA --- */}
                <div className="relative mb-2 overflow-hidden rounded-xl bg-gray-200 shadow-sm transition-all duration-300 hover:shadow-md">
                  {/* Aspect Ratio Hack or just use intrinsic height via masonry */}
                  <div className="relative w-full">
                    {post.assets[0] ? (
                      <Image
                        src={post.assets[0].url}
                        alt={post.caption ?? "Post image"}
                        width={500}
                        height={500}
                        className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        priority={index < 4} // Load top images first
                      />
                    ) : (
                      <div className="flex aspect-[4/5] w-full items-center justify-center bg-gray-100 text-gray-300">
                        <Clapperboard className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* OVERLAY: Top Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-90">
                    {isVendor && (
                      <span className="rounded bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                        OPEN
                      </span>
                    )}
                    {/* Placeholder for future logic (e.g. Waitlist) */}
                    {/* <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">WAITLIST</span> */}
                  </div>

                  {/* OVERLAY: Bottom Actions (Like/Comment) */}
                  {/* Hidden by default, visible on hover */}
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex items-center justify-end gap-2">
                      <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-pink-600">
                        <Heart className="h-4 w-4" />
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-blue-600">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* --- CARD FOOTER (User Info) --- */}
                <div className="px-1">
                  {/* Caption Truncated */}
                  {post.caption && (
                    <p className="mb-1.5 line-clamp-2 text-xs leading-snug font-medium text-gray-700">
                      {post.caption}
                    </p>
                  )}

                  {/* User Row */}
                  <div className="flex items-center justify-between">
                    <Link
                      href={profileUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="group/author flex min-w-0 items-center gap-2"
                    >
                      {/* Avatar */}
                      <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-100">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-[9px] font-bold text-gray-500">
                            {displayName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Name + Verified Badge */}
                      <div className="flex min-w-0 items-center gap-1">
                        <span className="truncate text-xs text-gray-500 transition-colors group-hover/author:text-gray-900">
                          {displayName}
                        </span>
                        {isVendor && (
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-blue-500" />
                        )}
                      </div>
                    </Link>

                    {/* Like Count (Subtle) */}
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Heart className="h-3 w-3" />
                      {post._count.likes}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Infinite Scroll Loader */}
        <div ref={ref} className="flex w-full justify-center py-8">
          {isFetchingNextPage && (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          )}
        </div>
      </section>

      {/* Post Modal */}
      {selectedPostIndex !== null && (
        <div className="relative z-[100]">
          <PostModal
            posts={allPosts}
            initialIndex={selectedPostIndex}
            onClose={() => setSelectedPostIndex(null)}
          />
        </div>
      )}
    </div>
  );
}
