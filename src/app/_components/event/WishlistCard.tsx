"use client";

import React, { useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import { Plus, Share2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { WishlistItemType, ContributionType } from "@prisma/client";
import { ShareWishlistModal } from "./modals/ShareWishlistModal";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventDetails = RouterOutput["event"]["getById"];
type Wishlist = EventDetails["wishlist"];
type WishlistItem = NonNullable<Wishlist>["items"][number];

interface WishlistCardProps {
  wishlist: Wishlist;
  _eventId: string;
  eventName: string;
  onManage: () => void;
  isPast?: boolean;
}

const isItemFulfilled = (item: WishlistItem) => {
  if (item.isFulfilled) return true;
  if (item.itemType === WishlistItemType.ITEM_REQUEST) {
    return item.contributions.some((c) => c.type === ContributionType.PROMISE);
  }
  if (item.itemType === WishlistItemType.CASH_REQUEST) {
    const totalContributed = item.contributions
      .filter((c) => c.type === ContributionType.CASH)
      .reduce((sum, c) => sum + (c.amount ?? 0), 0);
    return item.requestedAmount && totalContributed >= item.requestedAmount;
  }
  return false;
};

export const WishlistCard = ({
  wishlist,
  _eventId,
  eventName,
  onManage,
  isPast = false,
}: WishlistCardProps) => {
  const items = wishlist?.items ?? [];
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  return (
    <>
      <div className="rounded-xl bg-white p-4 shadow-lg sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            Event Wishlist
            {isPast && <Lock className="h-4 w-4 text-gray-400" />}
          </h3>
          <div className="flex items-center gap-2">
            {!isPast && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onManage}
                className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={handleShare}
              className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {items.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p className="text-sm">Your wishlist is empty.</p>
            </div>
          ) : (
            items.map((item) => {
              const isFulfilled = isItemFulfilled(item);
              const fulfiller = item.contributions.find((c) => c.guestName);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg p-3",
                    isFulfilled && "border border-green-200 bg-green-50",
                  )}
                >
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    {isFulfilled ? (
                      <p className="text-xs text-green-700">
                        Fulfilled by @{fulfiller?.guestName ?? "a guest"}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {item.itemType === "CASH_REQUEST"
                          ? `₦${(item.requestedAmount ?? 0).toLocaleString()}`
                          : "Contribution"}
                      </p>
                    )}
                  </div>
                  {isFulfilled ? (
                    <Button
                      size="sm"
                      className="bg-green-600 text-white hover:bg-green-700"
                      disabled
                    >
                      Fulfilled
                    </Button>
                  ) : (
                    // Hide manage/edit button if past
                    !isPast && (
                      <Button
                        size="sm"
                        onClick={onManage}
                        className="bg-pink-600 text-white hover:bg-pink-700"
                      >
                        Manage
                      </Button>
                    )
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <ShareWishlistModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        wishlistUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/wishlist/${_eventId}`}
        eventName={eventName}
      />
    </>
  );
};
