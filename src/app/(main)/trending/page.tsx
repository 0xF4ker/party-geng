"use client";

import { api } from "@/trpc/react";
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";
import {
  Loader2,
  Flame,
  Bookmark,
  Calendar,
  Clock,
  Sparkles,
  MapPin,
  Check,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useUiStore } from "@/stores/ui";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import Image from "next/image";
import TrendingPostCard from "@/app/_components/social/TrendingPostCard";
import DiscoverySidebar from "@/app/_components/social/DiscoverySidebar";
import PostModal from "@/app/_components/social/PostModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

type TabType = "events" | "trending" | "latest" | "saved";
type CategoryType = "all" | "vendor" | "event" | "client";

export default function TrendingPage() {
  const { user, isAuthenticated } = useAuth();
  const { headerHeight } = useUiStore();

  const [activeTab, setActiveTab] = useState<TabType>("trending");
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>("all");
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);

  // Clear hashtag filter when switching tabs/categories
  useEffect(() => {
    setSelectedHashtag(null);
  }, [activeTab, categoryFilter]);

  // ---- infinite scroll hook ----
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  }) as { ref: (node?: Element | null) => void; inView: boolean };

  // ---- 1. Queries for different tabs ----
  const trendingQuery = api.post.getTrending.useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: activeTab === "trending",
    }
  );

  const feedQuery = api.post.getFeed.useInfiniteQuery(
    { limit: 20, followingOnly: false },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: activeTab === "latest",
    }
  );

  const savedQuery = api.post.getBookmarked.useInfiniteQuery(
    {},
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: activeTab === "saved" && isAuthenticated,
    }
  );

  const { data: upcomingEvents = [], isLoading: eventsLoading } =
    api.event.getUpcomingEvents.useQuery(undefined, {
      enabled: activeTab === "events",
    });

  // ---- 2. Pick current active query ----
  const currentQuery =
    activeTab === "trending"
      ? trendingQuery
      : activeTab === "saved"
      ? savedQuery
      : activeTab === "events"
      ? { data: undefined, isLoading: eventsLoading, isError: false, fetchNextPage: async () => {}, hasNextPage: false, isFetchingNextPage: false }
      : feedQuery;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = currentQuery;

  // ---- 3. Fetch next page when in view ----
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ---- 4. Flatten posts from infinite pages ----
  const allPosts = data?.pages.flatMap((page) => {
    if ("posts" in page) return page.posts;
    if ("items" in page) return page.items;
    return [];
  }) ?? [];

  // ---- 5. Client side filtering ----
  const filteredPosts = allPosts.filter((post) => {
    // Automatic filter: Only show posts that contain the "#trending" tag
    const caption = post.caption?.toLowerCase() ?? "";
    if (!caption.includes("#trending")) {
      return false;
    }

    if (selectedHashtag) {
      if (!caption.includes(selectedHashtag.toLowerCase())) {
        return false;
      }
    }
    if (categoryFilter === "all") return true;
    if (categoryFilter === "vendor") return post.author.role === "VENDOR";
    if (categoryFilter === "client") return post.author.role === "CLIENT";
    if (categoryFilter === "event") {
      // Simple logic to show event related posts
      return (
        caption.includes("#event") ||
        caption.includes("party") ||
        caption.includes("wedding") ||
        caption.includes("celebration")
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ─── HERO HEADER ─── */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50 py-12 border-b border-[var(--l-border)]"
        style={{ marginTop: headerHeight }}
      >
        {/* Glow Ambient Orbs */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-64 w-64 rounded-full bg-pink-300/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 h-64 w-64 rounded-full bg-purple-300/20 blur-3xl animate-pulse" />

        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3" /> trending geng
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--l-text)] sm:text-5xl md:text-6xl bg-gradient-to-r from-[var(--l-brand-pink)] to-[var(--l-brand-purple)] bg-clip-text text-transparent drop-shadow-sm pb-1">
            Trending Geng
          </h1>
          <p className="mt-4 text-base md:text-lg text-[var(--l-text-muted)] font-medium max-w-xl mx-auto">
            Discover trending highlights, explore vendor showreels, and connect with the community.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: "all", label: "All Posts" },
              { id: "vendor", label: "Vendors" },
              { id: "client", label: "Clients" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id as CategoryType)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs border",
                  categoryFilter === cat.id
                    ? "bg-[var(--l-text)] text-white border-[var(--l-text)]"
                    : "bg-white text-[var(--l-text-muted)] border-[var(--l-border)] hover:bg-gray-50 hover:text-[var(--l-text)]"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STICKY TAB BAR ─── */}
      <section
        className="sticky z-30 border-b border-[var(--l-border)] bg-white/90 backdrop-blur-md py-3 shadow-xs"
        style={{ top: headerHeight }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
              {[
                { id: "trending", label: "Trending", icon: Flame },
                { id: "latest", label: "Latest", icon: Clock },
                { id: "events", label: "Events", icon: Calendar },
                { id: "saved", label: "Saved", icon: Bookmark },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all",
                      activeTab === tab.id
                        ? "bg-[rgba(247,37,133,0.15)] text-[var(--l-brand-pink)] border border-[rgba(247,37,133,0.3)] shadow-[0_0_12px_rgba(247,37,133,0.2)]"
                        : "text-[var(--l-text-muted)] hover:bg-black/5 hover:text-[var(--l-text)] border border-transparent"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── MAIN CONTENT LAYOUT ─── */}
      <div className="container mx-auto px-4 py-8 md:px-6">
        {/* Stories Bar (commented out for now) */}
        {/*
        <div className="mb-8 border-b border-[var(--l-border)] pb-6">
          <StoriesBar />
        </div>
        */}

        {/* Event Hype Row at the top (commented out for now) */}
        {/*
        <div className="mb-10">
          <EventHypeCards />
        </div>
        */}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-6">
            {selectedHashtag && (
              <div className="flex items-center justify-between rounded-2xl bg-pink-50/50 border border-pink-100/60 p-4 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-pink-500 animate-pulse" />
                  <span className="text-sm font-medium text-pink-700">
                    Showing posts matching <span className="font-bold text-pink-600">{selectedHashtag}</span>
                  </span>
                </div>
                <button
                  onClick={() => setSelectedHashtag(null)}
                  className="rounded-full bg-white border border-pink-200 px-3 py-1 text-xs font-bold text-pink-600 shadow-sm transition-all hover:bg-pink-50 active:scale-95"
                >
                  Clear Filter
                </button>
              </div>
            )}

            {activeTab === "events" ? (
              eventsLoading ? (
                <div className="flex h-60 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--l-brand-pink)]" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="rounded-2xl border border-[var(--l-border)] bg-white p-12 text-center shadow-xs">
                  <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 text-lg font-bold text-[var(--l-text)]">No upcoming events</h3>
                  <p className="mt-1 text-sm text-[var(--l-text-muted)]">
                    Check back soon — the community is planning something!
                  </p>
                </div>
              ) : (
                <EventsTabContent
                  events={upcomingEvents}
                  currentUserEmail={user?.email}
                  isAuthenticated={isAuthenticated}
                />
              )
            ) : activeTab === "saved" && !isAuthenticated ? (
              <div className="rounded-2xl border border-[var(--l-border)] bg-white p-12 text-center shadow-xs">
                <Bookmark className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-bold text-[var(--l-text)]">Sign in to see saved posts</h3>
                <p className="mt-1 text-sm text-[var(--l-text-muted)]">
                  Keep track of posts you want to refer back to later.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex h-60 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--l-brand-pink)]" />
              </div>
            ) : isError ? (
              <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center text-red-600">
                <p className="font-medium">Failed to load posts. Please try again later.</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="rounded-2xl border border-[var(--l-border)] bg-white p-12 text-center shadow-xs">
                <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-bold text-[var(--l-text)]">No posts found</h3>
                <p className="mt-1 text-sm text-[var(--l-text-muted)]">
                  Be the first to share a post in this category!
                </p>
              </div>
            ) : (
              <div className="columns-1 gap-6 space-y-6 sm:columns-2">
                {filteredPosts.map((post, idx) => (
                  <div key={post.id} className="break-inside-avoid mb-6">
                    <TrendingPostCard
                      post={post}
                      onOpenModal={() => setSelectedPostIndex(idx)}
                      onHashtagClick={(tag) => setSelectedHashtag(tag)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Infinite Scroll Loader */}
            <div ref={ref} className="flex w-full justify-center py-6">
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin text-[var(--l-text-muted)]" />
              )}
            </div>
          </div>

          {/* Sticky Sidebar (Desktop only) */}
          <div className="hidden lg:block lg:col-span-1">
            <div
              className="sticky h-fit"
              style={{ top: `calc(${headerHeight}px + 88px)` }}
            >
              <DiscoverySidebar posts={allPosts} />
            </div>
          </div>
        </div>
      </div>

      {/* Post Modal popup */}
      {selectedPostIndex !== null && (
        <div className="relative z-[100]">
          <PostModal
            posts={filteredPosts}
            initialIndex={selectedPostIndex}
            onClose={() => setSelectedPostIndex(null)}
          />
        </div>
      )}
    </div>
  );
}

// =====================================================================
// Events Tab Component
// =====================================================================
const GRADIENTS = [
  "from-orange-400 to-pink-500",
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-600",
  "from-emerald-400 to-teal-500",
  "from-blue-500 to-indigo-600",
];

function getEventGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]!;
}

function getEventEmoji(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("beach") || lower.includes("pool") || lower.includes("summer")) return "🏖️";
  if (lower.includes("tech") || lower.includes("code") || lower.includes("meetup")) return "💻";
  if (lower.includes("wedding") || lower.includes("marriage") || lower.includes("reception")) return "💒";
  if (lower.includes("birthday") || lower.includes("bash") || lower.includes("cake")) return "🎂";
  if (lower.includes("music") || lower.includes("concert") || lower.includes("show")) return "🎵";
  if (lower.includes("drink") || lower.includes("cocktail") || lower.includes("party")) return "🍸";
  return "🎉";
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

type RouterOutputs = inferRouterOutputs<AppRouter>;
type UpcomingEvent = RouterOutputs["event"]["getUpcomingEvents"][number];

interface EventsTabContentProps {
  events: UpcomingEvent[];
  currentUserEmail: string | undefined;
  isAuthenticated: boolean;
}

function EventsTabContent({ events, currentUserEmail, isAuthenticated }: EventsTabContentProps) {
  const utils = api.useUtils();

  const attendMutation = api.event.toggleAttendPublicEvent.useMutation({
    onSuccess: (data) => {
      toast.success(data.attending ? "You're on the guest list! 🎉" : "RSVP cancelled.");
      void utils.event.getUpcomingEvents.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update RSVP");
    },
  });

  const handleRsvp = (eventId: string) => {
    if (!isAuthenticated) {
      toast("Login required to RSVP");
      return;
    }
    attendMutation.mutate({ eventId });
  };

  const processed = useMemo(() => {
    return events.map((event) => {
      const attendeesCount = event.guestLists.reduce(
        (sum, list) => sum + list.guests.filter((g) => g.status === "ATTENDING").length,
        0,
      );
      const isUserAttending = event.guestLists.some((list) =>
        list.guests.some((g) => g.email === currentUserEmail && g.status === "ATTENDING"),
      );
      const startDate = new Date(event.startDate);
      const formattedDate = startDate.toLocaleDateString("en-NG", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const daysToGo = getDaysUntil(startDate);
      const gradient = getEventGradient(event.id);
      const emoji = getEventEmoji(event.title);
      
      const expectedGuests = (event.questionnaireData as any)?.expectedGuests;
      const capacity = expectedGuests && Number(expectedGuests) > 0 ? Number(expectedGuests) : 150;
      const fillPercent = Math.min(100, Math.round((attendeesCount / capacity) * 100));

      return { ...event, formattedDate, attendeesCount, isUserAttending, daysToGo, gradient, emoji, capacity, fillPercent };
    });
  }, [events, currentUserEmail]);

  return (
    <div className="space-y-4">
      {processed.map((event) => (
        <div
          key={event.id}
          className="group rounded-2xl border border-[var(--l-border)] bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
        >
          {/* Clickable Card Area */}
          <Link href={`/events/${event.id}`} className="block flex-grow">
            {/* Coloured banner */}
            <div className="relative h-36 w-full overflow-hidden flex items-center justify-center bg-gray-900">
              {event.coverImage ? (
                <>
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                </>
              ) : (
                <div className={cn("absolute inset-0 bg-gradient-to-br transition-all group-hover:opacity-95", event.gradient)} />
              )}
              
              <div className="relative z-10 flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
                <span className="text-4xl drop-shadow-lg transition-transform group-hover:scale-110 duration-300 inline-block">{event.emoji}</span>
                <h3 className="text-lg font-bold text-white drop-shadow-md line-clamp-1 group-hover:text-pink-100 transition-colors">{event.title}</h3>
              </div>
              
              {/* Ticket Price Badge */}
              <div className="absolute top-3 left-3 z-20">
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-sm border border-white/20 text-white",
                  event.isTicketed ? "bg-purple-600/90" : "bg-green-600/90"
                )}>
                  {event.isTicketed ? `₦${(event.ticketPrice ?? 0).toLocaleString()}` : "Free"}
                </span>
              </div>

              {/* Days badge */}
              <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
                {event.daysToGo > 0 ? `${event.daysToGo}d to go` : "Happening now!"}
              </span>
            </div>

            {/* Details */}
            <div className="p-4 pb-2 space-y-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-pink-500" />
                  {event.formattedDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-purple-400" />
                  <span className="max-w-[200px] truncate">
                    {(event.location as Record<string, unknown>)?.display_name as string ?? (event.location as Record<string, unknown>)?.address as string ?? "Lagos, Nigeria"}
                  </span>
                </span>
              </div>
              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${event.fillPercent}%` }}
                  />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-[var(--l-text-muted)]">
                  <Users className="h-3 w-3" />
                  {event.attendeesCount} going / Cap: {event.capacity}
                </span>
              </div>
            </div>
          </Link>

          {/* Action Row */}
          <div className="px-4 pb-4 flex justify-end">
            {event.isTicketed ? (
              <Link href={`/events/${event.id}`}>
                <Button
                  size="sm"
                  className="rounded-full px-5 font-semibold bg-gradient-to-r from-[#f72585] to-[#7209b7] text-white hover:opacity-90 shadow-[0_4px_14px_rgba(247,37,133,0.35)]"
                >
                  Get Tickets
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                onClick={() => handleRsvp(event.id)}
                disabled={attendMutation.isPending}
                className={cn(
                  "shrink-0 rounded-full px-5 font-semibold transition-all",
                  event.isUserAttending
                    ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 shadow-none"
                    : "bg-gradient-to-r from-[#f72585] to-[#7209b7] text-white hover:opacity-90 shadow-[0_4px_14px_rgba(247,37,133,0.35)]",
                )}
              >
                {attendMutation.isPending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : event.isUserAttending ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Attending
                  </span>
                ) : (
                  "RSVP Now"
                )}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
