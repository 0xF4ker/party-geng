"use client";

import React from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import { GiftIcon } from "lucide-react";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventDetails = RouterOutput["event"]["getById"];
type Wishlist = EventDetails["wishlist"];

interface WishlistCardProps {
  wishlist: Wishlist;
  eventId: string;
  onManage: () => void;
}

export const WishlistCard = ({ wishlist, eventId, onManage }: WishlistCardProps) => {
  const totalItems = wishlist?.items.length ?? 0;
  const fulfilledItems =
    wishlist?.items.filter((item) => item.isFulfilled).length ?? 0;

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h3 className="text-xl font-bold text-gray-900">Wishlist</h3>
      <div className="mt-4 flex items-center justify-around text-center">
        <div>
          <p className="text-3xl font-bold text-gray-800">{totalItems}</p>
          <p className="text-sm text-gray-500">Total Items</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-green-600">{fulfilledItems}</p>
          <p className="text-sm text-gray-500">Fulfilled</p>
        </div>
      </div>
      <div className="mt-6">
        <Button variant="outline" className="w-full" onClick={onManage}>
          <GiftIcon className="mr-2 h-4 w-4" />
          Manage Wishlist
        </Button>
      </div>
    </div>
  );
};
