"use client";

import React from "react";
import {
  Calendar,
  Gift,
  CheckCircle,
  CreditCard, // For pay
  HandHeart, // For promise
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

// --- Types ---
type routerOutput = inferRouterOutputs<AppRouter>;
type EventWishlistOutput = routerOutput["wishlist"]["getByEventId"]["wishlist"];

type EventWithWishlist = NonNullable<EventWishlistOutput>;

type WishlistItemWithPromises = EventWithWishlist["items"][number];

// --- Main Page Component ---
const PublicWishlistPage = () => {
  const params = useParams();
  const eventId = params.id as string;
  const { user } = useAuth();

  // Fetch event and wishlist data
  const {
    data: event,
    isLoading,
    error,
  } = api.wishlist.getByEventId.useQuery({ eventId }, { enabled: !!eventId });

  // Mutations
  const utils = api.useUtils();
  const promiseItem = api.wishlist.promiseItem.useMutation({
    onSuccess: () => {
      void utils.wishlist.getByEventId.invalidate({ eventId });
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const handlePromiseItem = (itemId: string) => {
    if (!user) {
      alert("Please sign in to promise an item");
      return;
    }

    const guestName = user.clientProfile?.name ?? user.username ?? "Guest";
    promiseItem.mutate({ itemId, guestName });
  };

  const handlePay = (item: WishlistItemWithPromises) => {
    alert(
      `Redirecting to payment for: ${item.name} (₦${item.price?.toLocaleString() ?? "0"})`,
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <div className="container mx-auto max-w-4xl px-4 py-20">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="text-2xl font-bold text-red-800">Event Not Found</h2>
            <p className="mt-2 text-red-600">
              {error?.message ??
                "This event wishlist could not be found or is private."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const wishlistItems = event.wishlist?.items ?? [];
  const hostName = event.client?.name ?? event.client.user.username ?? "Host";
  const hostAvatar =
    event.client?.avatarUrl ??
    "https://placehold.co/128x128/3b82f6/ffffff?text=H";
  const coverImage =
    event.coverImage ??
    "https://placehold.co/1200x400/ec4899/ffffff?text=Event";

  return (
    // This page is standalone, so no sticky header padding
    <div className="min-h-screen bg-gray-100 text-gray-900">
      {/* --- Event Header --- */}
      <div className="bg-white shadow-sm">
        <div
          className="h-48 bg-cover bg-center md:h-64"
          style={{ backgroundImage: `url(${coverImage})` }}
        ></div>
        <div className="container mx-auto -mt-16 max-w-4xl px-4 py-6 sm:px-8">
          <div className="flex flex-col items-center gap-6 rounded-lg bg-white p-6 shadow-lg md:flex-row">
            <Image
              src={hostAvatar}
              alt={hostName}
              className="-mt-16 h-24 w-24 shrink-0 rounded-full border-4 border-white shadow-md md:mt-0 md:-ml-16"
              width={96}
              height={96}
            />
            <div className="text-center md:text-left">
              <p className="text-sm font-semibold text-pink-600">
                You&apos;re invited to
              </p>
              <h1 className="text-3xl font-bold text-gray-800">
                {event.title}
              </h1>
              <p className="mt-1 text-lg text-gray-600">
                <Calendar className="mr-2 inline-block h-5 w-5" />
                {new Date(event.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-8">
        {/* Welcome Message */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <p className="text-center leading-relaxed text-gray-700">
            <span className="font-semibold">{hostName}</span> has created a
            wishlist for this event.
            {wishlistItems.length === 0 && " No items added yet."}
          </p>
        </div>

        {/* Wishlist Grid */}
        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {wishlistItems.map((item) => (
              <WishlistItemCard
                key={item.id}
                item={item}
                currentUserId={user?.id}
                onPromise={handlePromiseItem}
                onPay={handlePay}
                isPromising={promiseItem.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <Gift className="mx-auto h-16 w-16 text-gray-300" />
            <p className="mt-4 text-gray-500">No wishlist items yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-Components ---

const WishlistItemCard = ({
  item,
  currentUserId,
  onPromise,
  onPay,
  isPromising,
}: {
  item: WishlistItemWithPromises;
  currentUserId?: string;
  onPromise: (itemId: string) => void;
  onPay: (item: WishlistItemWithPromises) => void;
  isPromising: boolean;
}) => {
  // Check if current user has promised this item
  const userPromise = item.promises?.find(
    (p) => p.guestUserId === currentUserId,
  );
  const hasPromised = !!userPromise;

  // Get list of promisor names
  const promisorNames = item.promises?.map((p) => p.guestName) ?? [];
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm",
        item.isFulfilled && "bg-gray-50 opacity-70",
      )}
    >
      <div className="flex grow flex-col p-5">
        {/* Status Badge */}
        {item.isFulfilled ? (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            <CheckCircle className="h-4 w-4" />
            Fulfilled!
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            <Gift className="h-4 w-4" />
            Still Needed
          </span>
        )}

        <h3
          className={cn(
            "mt-3 text-xl font-bold text-gray-800",
            item.isFulfilled && "text-gray-500 line-through",
          )}
        >
          {item.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Est. Price: ₦{item.price?.toLocaleString() ?? "N/A"}
        </p>

        {/* Promisors List */}
        <div className="mt-4 grow border-t border-gray-100 pt-4">
          <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase">
            Promised By:
          </h4>
          {promisorNames.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {promisorNames.map((name: string, index: number) => (
                <span
                  key={index}
                  className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-sm font-medium text-gray-700"
                >
                  <HandHeart className="h-4 w-4 text-pink-500" />
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No promises yet.</p>
          )}
        </div>

        {/* Actions */}
        {!item.isFulfilled && (
          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row">
            <button
              onClick={() => onPromise(item.id)}
              disabled={hasPromised || isPromising}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md bg-pink-100 px-4 py-2.5 font-bold text-pink-700 transition-colors hover:bg-pink-200",
                (hasPromised || isPromising) && "cursor-not-allowed opacity-60",
              )}
            >
              {isPromising ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <HandHeart className="h-5 w-5" />
              )}
              {hasPromised
                ? "You Promised!"
                : isPromising
                  ? "Promising..."
                  : "I'll Promise This"}
            </button>
            <button
              onClick={() => onPay(item)}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-gray-800 px-4 py-2.5 font-bold text-white transition-colors hover:bg-gray-900"
            >
              <CreditCard className="h-5 w-5" />
              Contribute or Pay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicWishlistPage;
