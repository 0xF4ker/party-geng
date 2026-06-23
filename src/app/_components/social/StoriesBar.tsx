"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { api } from "@/trpc/react";
import { Plus, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Curated story background gradients for the mock creation tool
const STORY_TEMPLATES = [
  "from-pink-500 via-red-500 to-yellow-500",
  "from-purple-600 to-indigo-600",
  "from-emerald-400 to-cyan-500",
  "from-orange-400 to-rose-500",
  "from-fuchsia-600 to-pink-500",
];

export default function StoriesBar() {
  const { user, isAuthenticated } = useAuth();
  const utils = api.useUtils();

  // Query stories
  const { data: storyGroups = [], isLoading } =
    api.social.getActiveStories.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  // Mutations
  const createStoryMutation = api.social.createStory.useMutation({
    onSuccess: () => {
      toast.success("Story posted successfully!");
      void utils.social.getActiveStories.invalidate();
    },
    onError: () => toast.error("Failed to post story"),
  });

  const viewStoryMutation = api.social.viewStory.useMutation({
    onSuccess: () => {
      void utils.social.getActiveStories.invalidate();
    },
  });

  // Modal / active story states
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [progress, setProgress] = useState(0);

  // Handle story creation (mock images using beautiful gradients/unsplash)
  const handleAddStory = () => {
    if (!isAuthenticated) {
      toast("Login required to add a story");
      return;
    }
    const templateIdx = Math.floor(Math.random() * STORY_TEMPLATES.length);
    const mockStoryUrl = `https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80&template=${templateIdx}`;

    createStoryMutation.mutate({
      url: mockStoryUrl,
      type: "IMAGE",
    });
  };

  const currentGroup =
    activeGroupIndex !== null ? storyGroups[activeGroupIndex] : null;
  const currentStory = currentGroup ? currentGroup.stories[activeStoryIndex] : null;

  // Auto-progress logic for active story
  useEffect(() => {
    if (activeGroupIndex === null || !currentGroup || !currentStory) {
      setProgress(0);
      return;
    }

    // Mark story as viewed
    if (currentStory.views.length === 0) {
      viewStoryMutation.mutate({ storyId: currentStory.id });
    }

    setProgress(0);
    const intervalTime = 50; // Update progress every 50ms
    const totalTime = 4000; // Story duration 4s
    const increment = (intervalTime / totalTime) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          handleNextStory();
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeGroupIndex, activeStoryIndex, currentStory]);

  const handleNextStory = () => {
    if (activeGroupIndex === null || !currentGroup) return;

    if (activeStoryIndex < currentGroup.stories.length - 1) {
      // Next story in current group
      setActiveStoryIndex((prev) => prev + 1);
    } else if (activeGroupIndex < storyGroups.length - 1) {
      // Next author group
      setActiveGroupIndex((prev) => prev! + 1);
      setActiveStoryIndex(0);
    } else {
      // End of all stories
      closeStories();
    }
  };

  const handlePrevStory = () => {
    if (activeGroupIndex === null || !currentGroup) return;

    if (activeStoryIndex > 0) {
      // Prev story in current group
      setActiveStoryIndex((prev) => prev - 1);
    } else if (activeGroupIndex > 0) {
      // Prev author group
      setActiveGroupIndex((prev) => prev! - 1);
      const prevGroup = storyGroups[activeGroupIndex - 1];
      setActiveStoryIndex(prevGroup ? prevGroup.stories.length - 1 : 0);
    } else {
      // Beginning of all stories
      setActiveStoryIndex(0);
    }
  };

  const openGroup = (idx: number) => {
    setActiveGroupIndex(idx);
    setActiveStoryIndex(0);
    setProgress(0);
  };

  const closeStories = () => {
    setActiveGroupIndex(null);
    setActiveStoryIndex(0);
    setProgress(0);
  };

  // Find if current logged in user has stories
  const hasOwnStories = storyGroups.some((g) => g.author.id === user?.id);

  if (isLoading && isAuthenticated) {
    return (
      <div className="flex gap-4 overflow-x-auto py-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 animate-pulse">
            <div className="h-16 w-16 rounded-full bg-gray-200" />
            <div className="h-3 w-12 rounded-sm bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ─── Story Horizontal Scroll ─── */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide select-none">
        {/* User's Add Story pill */}
        {!hasOwnStories && isAuthenticated && (
          <button
            onClick={handleAddStory}
            className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
          >
            <div className="relative h-16 w-16 rounded-full border border-dashed border-gray-300 bg-white flex items-center justify-center transition-all group-hover:border-pink-500 group-hover:scale-[1.03]">
              <div className="absolute bottom-0 right-0 h-5 w-5 bg-pink-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm group-hover:bg-pink-700">
                <Plus className="h-3.5 w-3.5" />
              </div>
              {user?.clientProfile?.avatarUrl || user?.vendorProfile?.avatarUrl ? (
                <Image
                  src={
                    (user?.clientProfile?.avatarUrl ||
                      user?.vendorProfile?.avatarUrl)!
                  }
                  alt="My Profile"
                  width={56}
                  height={56}
                  className="rounded-full object-cover h-14 w-14"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-pink-50 flex items-center justify-center text-sm font-bold text-pink-600">
                  {user?.username[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-[11px] font-bold text-gray-500 group-hover:text-pink-600">
              Add Story
            </span>
          </button>
        )}

        {/* Story Groups */}
        {storyGroups.map((group, idx) => {
          const isOwn = group.author.id === user?.id;
          const isVendor = group.author.role === "VENDOR";
          const avatar = isVendor
            ? group.author.vendorProfile?.avatarUrl
            : group.author.clientProfile?.avatarUrl;
          const name = isVendor
            ? group.author.vendorProfile?.companyName
            : group.author.clientProfile?.name ?? group.author.username;

          return (
            <div
              key={group.author.id}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <button
                onClick={() => openGroup(idx)}
                className="relative focus:outline-none transition-transform hover:scale-[1.03]"
              >
                {/* Glow ring based on unviewed status */}
                <div
                  className={cn(
                    "h-16 w-16 rounded-full p-[2.5px] flex items-center justify-center",
                    group.hasUnviewed
                      ? "bg-gradient-to-tr from-[#f72585] via-[#7209b7] to-[#ffbe0b]"
                      : "bg-gray-200"
                  )}
                >
                  <div className="bg-white rounded-full p-[2px] h-full w-full flex items-center justify-center">
                    {avatar ? (
                      <Image
                        src={avatar}
                        alt={name ?? "User"}
                        width={56}
                        height={56}
                        className="rounded-full object-cover h-full w-full"
                      />
                    ) : (
                      <div className="h-full w-full rounded-full bg-pink-50 flex items-center justify-center text-sm font-bold text-pink-600">
                        {group.author.username[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                {/* Plus Overlay if it's the current user's story ring */}
                {isOwn && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddStory();
                    }}
                    className="absolute bottom-0 right-0 h-4.5 w-4.5 bg-pink-600 rounded-full flex items-center justify-center text-white border border-white shadow-sm hover:bg-pink-700"
                  >
                    <Plus className="h-3 w-3" />
                  </div>
                )}
              </button>
              <span className="text-[11px] font-semibold text-gray-600 max-w-[64px] truncate">
                {isOwn ? "Your Story" : name}
              </span>
            </div>
          );
        })}
      </div>

      {/* ─── Story Viewer Modal Overlay ─── */}
      {activeGroupIndex !== null && currentGroup && currentStory && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md">
          {/* Top Bar for group items progress */}
          <div className="absolute top-4 left-0 right-0 z-20 flex gap-1 px-4 max-w-lg mx-auto">
            {currentGroup.stories.map((s, idx) => (
              <div
                key={s.id}
                className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-[50ms]"
                  style={{
                    width:
                      idx < activeStoryIndex
                        ? "100%"
                        : idx === activeStoryIndex
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Author Row */}
          <div className="absolute top-8 left-0 right-0 z-20 flex items-center justify-between px-4 max-w-lg mx-auto text-white">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-full border border-white/20 overflow-hidden bg-zinc-800">
                {currentGroup.author.role === "VENDOR" ? (
                  currentGroup.author.vendorProfile?.avatarUrl && (
                    <Image
                      src={currentGroup.author.vendorProfile.avatarUrl}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  )
                ) : (
                  currentGroup.author.clientProfile?.avatarUrl && (
                    <Image
                      src={currentGroup.author.clientProfile.avatarUrl}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  )
                )}
              </div>
              <div>
                <p className="text-xs font-bold leading-none">
                  {currentGroup.author.role === "VENDOR"
                    ? currentGroup.author.vendorProfile?.companyName
                    : currentGroup.author.clientProfile?.name ??
                      currentGroup.author.username}
                </p>
                <p className="text-[10px] text-white/60 mt-0.5">
                  @{currentGroup.author.username}
                </p>
              </div>
            </div>
            <button
              onClick={closeStories}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Main Media Stage */}
          <div className="relative w-full max-w-lg aspect-[9/16] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
            {/* Visual gradient filter for unsplash mock story */}
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 via-transparent to-purple-500/20 mix-blend-overlay z-10" />

            <Image
              src={currentStory.url}
              alt="Story"
              fill
              className="object-cover"
              priority
              sizes="512px"
            />

            {/* Left/Right click triggers */}
            <div className="absolute inset-y-0 left-0 w-1/4 z-10" onClick={handlePrevStory} />
            <div className="absolute inset-y-0 right-0 w-1/4 z-10" onClick={handleNextStory} />
          </div>

          {/* Nav buttons (Desktop) */}
          <button
            onClick={handlePrevStory}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 hover:scale-105 rounded-full text-white transition-all hidden md:block"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNextStory}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 hover:scale-105 rounded-full text-white transition-all hidden md:block"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
