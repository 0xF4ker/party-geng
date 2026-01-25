"use client";

import React, { useState } from "react";
import { Star, Calendar, Gift, Loader2 } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { format } from "date-fns";

import ProfileHeader from "@/app/_components/profile/ProfileHeader";
import { GalleryTab } from "@/app/_components/profile/GalleryTab";

type routerOutput = inferRouterOutputs<AppRouter>;
type EventType = routerOutput["event"]["getMyEvents"]["upcoming"][number];

// --- Mock Data ---
const vendorReviews = [
  {
    id: 1,
    vendorName: "DJ SpinMaster",
    vendorAvatar: "https://placehold.co/40x40/ec4899/ffffff?text=DJ",
    rating: 5,
    date: "1 month ago",
    comment:
      "Adebayo was a fantastic client! Clear communication, prompt payment, and a great crowd. A pleasure to work for. 5 stars!",
  },
  {
    id: 2,
    vendorName: "SnapPro",
    vendorAvatar: "https://placehold.co/40x40/8d99ae/ffffff?text=S",
    rating: 5,
    date: "3 months ago",
    comment:
      "A true professional. Adebayo knew exactly what he wanted for his corporate event photography. Clear brief and respectful of our time. Highly recommend working with him.",
  },
];
// --- End Mock Data ---

// Helper function for date formatting
const formatEventDate = (start: Date | string, end: Date | string) => {
  const s = new Date(start);
  const e = new Date(end);

  if (s.toDateString() === e.toDateString()) {
    // Same day
    return format(s, "MMMM d, yyyy");
  } else if (s.getFullYear() === e.getFullYear()) {
    // Same year
    return `${format(s, "MMM d")} - ${format(e, "MMM d, yyyy")}`;
  } else {
    // Different years
    return `${format(s, "MMM d, yyyy")} - ${format(e, "MMM d, yyyy")}`;
  }
};

// --- Main Page Component ---
const ClientProfilePage = () => {
  const params = useParams();
  const username = params.user as string;
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");

  const {
    data: profileUser,
    isLoading: profileLoading,
    error: profileError,
  } = api.user.getByUsername.useQuery({ username });

  const { data: eventsData, isLoading: eventsLoading } =
    api.event.getMyEvents.useQuery(undefined, {
      enabled: !!profileUser && currentUser?.id === profileUser.id,
    });

  const isOwnProfile = currentUser?.id === profileUser?.id;

  if (profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
      </div>
    );
  }

  if (profileError || !profileUser?.clientProfile) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-red-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-red-800">Profile Not Found</h2>
          <p className="mt-2 text-red-600">
            This client profile could not be found.
          </p>
        </div>
      </div>
    );
  }

  const clientProfile = profileUser.clientProfile;
  const upcomingEvents =
    eventsData?.upcoming?.filter((e) => e.isPublic || isOwnProfile) ?? [];
  const pastEvents =
    eventsData?.past?.filter((e) => e.isPublic || isOwnProfile) ?? [];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <ProfileHeader
        clientProfile={clientProfile}
        profileUser={profileUser}
        isOwnProfile={isOwnProfile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="container mx-auto max-w-4xl px-4">
        {/* Tab Content */}
        <div className="py-8">
          {activeTab === "upcoming" && (
            <UpcomingEventsSection
              events={upcomingEvents}
              isLoading={eventsLoading}
              isOwnProfile={isOwnProfile}
            />
          )}
          {activeTab === "past" && (
            <PastEventsSection
              events={pastEvents}
              isLoading={eventsLoading}
              isOwnProfile={isOwnProfile}
            />
          )}
          {activeTab === "gallery" && <GalleryTab username={username} />}
          {activeTab === "reviews" && <ReviewsFromVendorsSection />}
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const UpcomingEventsSection = ({
  events,
  isLoading,
  isOwnProfile,
}: {
  events: EventType[];
  isLoading: boolean;
  isOwnProfile: boolean;
}) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-12 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 font-semibold text-gray-800">
          {isOwnProfile
            ? "You have no upcoming events"
            : "No public upcoming events"}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          {isOwnProfile
            ? "Events you create will show up here."
            : "Public events will show up here."}
        </p>
        {isOwnProfile && (
          <button
            onClick={() => router.push("/manage_events")}
            className="mt-6 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pink-700"
          >
            Create an Event
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};

const PastEventsSection = ({
  events,
  isLoading,
  isOwnProfile,
}: {
  events: EventType[];
  isLoading: boolean;
  isOwnProfile: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-12 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 font-semibold text-gray-800">
          {isOwnProfile ? "You have no past events" : "No public past events"}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Past events will appear here once they&apos;ve concluded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} isPast={true} />
      ))}
    </div>
  );
};

const EventCard = ({
  event,
  isPast = false,
}: {
  event: EventType;
  isPast?: boolean;
}) => {
  const router = useRouter();
  const wishlistCount = event.wishlist?.items?.length ?? 0;

  return (
    <div
      onClick={() => router.push(`/event/${event.id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-pink-200 hover:shadow-lg"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={
            event.coverImage ??
            "https://placehold.co/600x250/ec4899/ffffff?text=Event"
          }
          alt={event.title}
          className={cn(
            "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
            isPast && "grayscale",
          )}
          width={600}
          height={250}
        />
        {isPast && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full border border-white/30 bg-white/20 px-4 py-1 text-sm font-bold text-white backdrop-blur-md">
              Concluded
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between">
          <p
            className={cn(
              "text-sm font-semibold",
              isPast ? "text-gray-500" : "text-green-600",
            )}
          >
            {event.isPublic ? "Public Event" : "Private Event"}
          </p>
          {!event.isPublic && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              Private
            </span>
          )}
        </div>

        <h3 className="mt-1 text-xl font-bold transition-colors group-hover:text-pink-600">
          {event.title}
        </h3>

        {/* UPDATED DATE DISPLAY */}
        <p className="mt-1 text-sm text-gray-500">
          {formatEventDate(event.startDate, event.endDate)}
        </p>

        {wishlistCount > 0 && (
          <div className="mt-6 flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors group-hover:bg-pink-50/30">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-pink-500" />
              <div>
                <p className="font-semibold">Event Wishlist</p>
                <p className="text-sm text-gray-500">{wishlistCount} items</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/wishlist/${event.id}`);
              }}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:border-pink-600 hover:bg-pink-600 hover:text-white"
            >
              View List
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ReviewsFromVendorsSection = () => (
  <div className="space-y-6">
    {vendorReviews.map((review) => (
      <ReviewCard key={review.id} review={review} />
    ))}
  </div>
);

const ReviewCard = ({ review }: { review: (typeof vendorReviews)[0] }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between">
      <div className="flex items-center space-x-4">
        <Image
          src={review.vendorAvatar}
          alt={review.vendorName}
          className="h-12 w-12 rounded-full"
          width={48}
          height={48}
        />
        <div>
          <h4 className="font-bold">{review.vendorName}</h4>
          <p className="text-sm text-gray-500">
            Verified Vendor · {review.date}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-5 w-5",
              i < review.rating
                ? "fill-current text-yellow-400"
                : "text-gray-300",
            )}
          />
        ))}
      </div>
    </div>
    <p className="mt-4 text-gray-600">&quot;{review.comment}&quot;</p>
  </div>
);

export default ClientProfilePage;
