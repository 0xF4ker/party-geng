"use client";

import React from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import { UsersIcon } from "lucide-react";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventDetails = RouterOutput["event"]["getById"];
type GuestLists = EventDetails["guestLists"];

interface GuestListCardProps {
  guestLists: GuestLists;
  eventId: string;
  onManage: () => void;
}

export const GuestListCard = ({
  guestLists,
  eventId,
  onManage,
}: GuestListCardProps) => {
  const totalGuests =
    guestLists?.reduce((acc, list) => acc + list.guests.length, 0) ?? 0;

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h3 className="text-xl font-bold text-gray-900">Guest List</h3>
      <div className="mt-4 text-center">
        <p className="text-5xl font-bold text-gray-800">{totalGuests}</p>
        <p className="text-sm text-gray-500">Total Guests</p>
      </div>
      <div className="mt-6">
        <Button variant="outline" className="w-full" onClick={onManage}>
          <UsersIcon className="mr-2 h-4 w-4" />
          Manage Guests
        </Button>
      </div>
    </div>
  );
};
