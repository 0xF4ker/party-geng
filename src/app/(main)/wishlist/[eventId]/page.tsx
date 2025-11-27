"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2, Gift, Users, List } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ContributeModal } from "@/app/_components/wishlist/ContributeModal";
import { ContributionType } from "@prisma/client";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import NewWishlistHeader from "@/app/_components/wishlist/NewWishlistHeader";

type routerOutput = inferRouterOutputs<AppRouter>;
type EventWithWishlist = routerOutput["wishlist"]["getByEventId"];
type WishlistItem = NonNullable<EventWithWishlist["wishlist"]>["items"][number];

const PublicWishlistPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const utils = api.useUtils();
  const { data: event, isLoading } = api.wishlist.getByEventId.useQuery({
    eventId,
  });

  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [activeTab, setActiveTab] = useState<"wishlist" | "gifters">(
    "wishlist",
  );

  if (isLoading || !event) {
    return (
      <>
        {/* Render a simplified header during load */}
        <header className="fixed top-0 right-0 left-0 z-40 h-16 bg-white shadow-md"></header>
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <Loader2 className="h-16 w-16 animate-spin text-pink-600" />
        </div>
      </>
    );
  }

  const wishlist = event.wishlist;
  const wishlistItems = wishlist?.items ?? [];

  const gifters = wishlistItems
    .flatMap((item) => item.contributions)
    .filter(
      (c, i, self) => self.findIndex((s) => s.guestName === c.guestName) === i,
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <NewWishlistHeader event={event} />

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center">
          <p className="text-gray-600">
            This is the wishlist for <strong>{event.title}</strong>!
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("wishlist")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium",
                activeTab === "wishlist"
                  ? "border-pink-600 text-pink-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              )}
            >
              <List className="h-5 w-5" /> Wishlist{" "}
              <span className="rounded-full bg-gray-200 px-2 text-xs">
                {wishlistItems.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("gifters")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium",
                activeTab === "gifters"
                  ? "border-pink-600 text-pink-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              )}
            >
              <Users className="h-5 w-5" /> Gifters{" "}
              <span className="rounded-full bg-gray-200 px-2 text-xs">
                {gifters.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === "wishlist" && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {wishlistItems.length > 0 ? (
                wishlistItems.map((item) => (
                  <WishlistItemCard
                    key={item.id}
                    item={item}
                    onContribute={() => setSelectedItem(item)}
                  />
                ))
              ) : (
                <div className="col-span-full py-20">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia>
                        <Gift className="h-12 w-12 text-gray-400" />
                      </EmptyMedia>
                      <EmptyTitle>It&apos;s quiet in here...</EmptyTitle>
                      <EmptyDescription>
                        The host hasn&apos;t added any items to their wishlist
                        yet.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              )}
            </div>
          )}
          {activeTab === "gifters" && (
            <div className="py-10">
              {gifters.length > 0 ? (
                <div className="space-y-3">
                  {gifters.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-3 rounded-md bg-white p-3 shadow-sm"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 font-bold text-pink-600">
                        {g.guestName.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-semibold">{g.guestName}</p>
                      <span className="ml-auto text-xs text-gray-400">
                        {new Date(g.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia>
                      <Users className="h-12 w-12 text-gray-400" />
                    </EmptyMedia>
                    <EmptyTitle>No gifters yet</EmptyTitle>
                    <EmptyDescription>
                      Be the first one to make a wish come true!
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          )}
        </div>
      </main>

      {selectedItem && (
        <ContributeModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onSuccess={() => {
            void utils.wishlist.getByEventId.invalidate({ eventId });
          }}
          itemId={selectedItem.id}
          itemName={selectedItem.name}
          eventName={event.title}
          allowCashContribution={selectedItem.cashContribution}
        />
      )}
    </div>
  );
};

const WishlistItemCard = ({
  item,
  onContribute,
}: {
  item: WishlistItem;
  onContribute: () => void;
}) => {
  const isPromised = item.contributions.some(
    (c) => c.type === ContributionType.PROMISE,
  );
  const cashContributions = item.contributions.filter(
    (c) => c.type === ContributionType.CASH,
  );
  const totalCashContributed = cashContributions.reduce(
    (sum, c) => sum + (c.amount ?? 0),
    0,
  );
  const progress = item.price ? (totalCashContributed / item.price) * 100 : 0;
  const isFulfilled =
    item.isFulfilled ||
    (item.price !== null &&
      item.price > 0 &&
      totalCashContributed >= (item.price ?? 0));

  const isDisabled = isFulfilled || isPromised;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
      <div className="relative h-48 w-full">
        {isFulfilled && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-900/60">
            <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-green-800">
              Fulfilled!
            </span>
          </div>
        )}
        <Image
          src={item.imageUrl ?? `https://picsum.photos/seed/${item.id}/300/300`}
          alt={item.name}
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <p className="font-semibold text-gray-800">{item.name}</p>
          {item.storeName && (
            <a
              href={item.storeUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:underline"
            >
              from {item.storeName}
            </a>
          )}
        </div>
        <div className="mt-4">
          {item.cashContribution && item.price && item.price > 0 ? (
            <div>
              <div className="mb-1 flex justify-between text-xs text-gray-600">
                <span className="font-semibold">
                  ₦{totalCashContributed.toLocaleString()}
                </span>
                <span className="font-semibold">
                  ₦{item.price.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-pink-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <p className="text-lg font-bold">
              ₦{item.price?.toLocaleString() ?? "0"}
            </p>
          )}
        </div>
      </div>
      <div className="border-t p-3">
        <Button
          onClick={onContribute}
          className="w-full font-semibold"
          disabled={isDisabled}
        >
          {isFulfilled ? "Fulfilled" : isPromised ? "Promised" : "Contribute"}
        </Button>
      </div>
    </div>
  );
};

export default PublicWishlistPage;
