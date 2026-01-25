"use client";

import React from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarDays, UserPlus, Lock } from "lucide-react";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventDetails = RouterOutput["event"]["getById"];
type HiredVendor = EventDetails["hiredVendors"][number];

interface BookedVendorsCardProps {
  vendors: HiredVendor[];
  _eventId: string;
  onAdd: () => void;
  isPast?: boolean; // Added Prop
}

export const BookedVendorsCard = ({
  vendors,
  _eventId,
  onAdd,
  isPast = false,
}: BookedVendorsCardProps) => {
  return (
    <div className="flex flex-col rounded-lg bg-white p-6 shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          Booked Vendors
          {isPast && <Lock className="h-4 w-4 text-gray-400" />}
        </h3>
        {!isPast && (
          <Button variant="outline" size="sm" onClick={onAdd}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        )}
      </div>
      <div className="mt-4 grow space-y-4">
        {vendors.length > 0 ? (
          vendors.map(({ vendor }) => (
            <div key={vendor.id} className="flex items-center gap-4">
              {/* ... Vendor Image & Name ... */}
              <Image
                src={
                  vendor.vendorProfile?.avatarUrl ??
                  "https://placehold.co/40x40"
                }
                alt={
                  vendor.vendorProfile?.companyName ??
                  vendor.username ??
                  "Vendor"
                }
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <p className="font-semibold text-gray-800">
                  {vendor.vendorProfile?.companyName ?? vendor.username}
                </p>
                <Link
                  href={`/v/${vendor.username}`}
                  className="text-sm text-pink-600 hover:underline"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No vendors booked.</p>
        )}
      </div>
      <div className="mt-4">
        <Link href={`/event/${_eventId}/board`} passHref>
          <Button variant="secondary" size="lg" className="w-full">
            <CalendarDays className="mr-2 h-4 w-4" />
            {isPast ? "View Moodboard" : "Join Moodboard"}
          </Button>
        </Link>
      </div>
    </div>
  );
};
