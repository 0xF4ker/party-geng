"use client";
import React, { useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import { Plus, Share2, Lock, DollarSign, Gift, Check } from "lucide-react";
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
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-gray-900">
              Event Wishlist
              {isPast && <Lock className="h-4 w-4 text-gray-400" />}
            </h3>
            <p className="text-[10px] text-gray-500 font-medium">Let guests help make your wishes come true</p>
          </div>
          <div className="flex items-center gap-2">
            {!isPast && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onManage}
                className="h-8 w-8 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors"
              >
                <Plus className="h-4.5 w-4.5" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={handleShare}
              className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
            >
              <Share2 className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
        <div className="mt-4 space-y-2.5">
          {items.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <Gift className="mx-auto h-8 w-8 mb-2 opacity-40 text-purple-400" />
              <p className="text-xs">Your wishlist is empty.</p>
            </div>
          ) : (
            items.map((item) => {
              const isFulfilled = isItemFulfilled(item);
              const fulfiller = item.contributions.find((c) => c.guestName);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-3.5 transition-all duration-200 hover:translate-x-0.5",
                    isFulfilled
                      ? "border-emerald-100 bg-emerald-50/40"
                      : "border-gray-100 bg-gray-50/30 hover:border-pink-100 hover:bg-pink-50/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      isFulfilled
                        ? "bg-emerald-100 text-emerald-700"
                        : item.itemType === "CASH_REQUEST"
                        ? "bg-pink-100 text-pink-600"
                        : "bg-purple-100 text-purple-600"
                    )}>
                      {isFulfilled ? (
                        <Check className="h-4 w-4" />
                      ) : item.itemType === "CASH_REQUEST" ? (
                        <DollarSign className="h-4 w-4" />
                      ) : (
                        <Gift className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                      {isFulfilled ? (
                        <p className="text-[10px] text-emerald-700 font-semibold">
                          Fulfilled by {fulfiller?.guestName ?? "a guest"}
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                          {item.itemType === "CASH_REQUEST"
                            ? `Cash: ₦${(item.requestedAmount ?? 0).toLocaleString()}`
                            : "Item Promise"}
                        </p>
                      )}
                    </div>
                  </div>
                  {isFulfilled ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      Fulfilled
                    </span>
                  ) : (
                    !isPast && (
                      <Button
                        size="sm"
                        onClick={onManage}
                        className="h-7 rounded-xl bg-pink-600 text-white hover:bg-pink-700 text-xs font-bold transition shadow-sm shadow-pink-100"
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
