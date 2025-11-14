"use client";

import React, { useState } from "react";
import {
  Star,
  Check,
  MapPin,
  MessageSquare,
  Calendar,
  Gift,
  Loader2,
  Edit,
  MoreHorizontal,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

import ProfileHeader from "@/app/_components/profile/ProfileHeader";

type routerOutput = inferRouterOutputs<AppRouter>;
type user = routerOutput["user"]["getByUsername"];
type clientProfile = user["clientProfile"];
type event = routerOutput["event"]["getMyEvents"]["upcoming"][number];
type eventPast = routerOutput["event"]["getMyEvents"]["past"][number];

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
  const upcomingEvents = eventsData?.upcoming?.filter((e) => e.isPublic) ?? [];
  const pastEvents = eventsData?.past?.filter((e) => e.isPublic) ?? [];

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
            <PastEventsSection events={pastEvents} isLoading={eventsLoading} />
          )}
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
  events: event[];
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
            ? "You have no public upcoming events"
            : "No public upcoming events"}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Public events you create will show up here.
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

const EventCard = ({ event }: { event: event }) => {
  const router = useRouter();
  const wishlistCount = event.wishlist?.items?.length ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md">
      <Image
        src={
          event.coverImage ??
          "https://placehold.co/600x250/ec4899/ffffff?text=Event"
        }
        alt={event.title}
        className="h-48 w-full object-cover"
        width={600}
        height={250}
      />
      <div className="p-5">
        <p className="text-sm font-semibold text-green-600">Public Event</p>
        <h3 className="mt-1 text-xl font-bold">{event.title}</h3>
        <p className="mt-1 text-sm text-gray-500">
          {new Date(event.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        {wishlistCount > 0 && (
          <div className="mt-6 flex items-center justify-between rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-pink-500" />
              <div>
                <p className="font-semibold">This event has a wishlist!</p>
                <p className="text-sm text-gray-500">{wishlistCount} items</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/event/${event.id}/wishlist`)}
              className="rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300"
            >
              View
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const PastEventsSection = ({
  events,
  isLoading,
}: {
  events: eventPast[];
  isLoading: boolean;
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
          No public past events
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Past events will appear here once they&apos;ve concluded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">{event.title}</h3>
              <p className="text-sm text-gray-500">
                {new Date(event.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              Concluded
            </div>
          </div>
        </div>
      ))}
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
