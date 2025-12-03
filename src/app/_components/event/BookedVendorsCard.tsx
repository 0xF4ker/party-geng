"use client";

import React from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarDays, UserPlus } from "lucide-react";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventDetails = RouterOutput["event"]["getById"];
type HiredVendor = EventDetails["hiredVendors"][number];

interface BookedVendorsCardProps {
  vendors: HiredVendor[];
  _eventId: string;
  onAdd: () => void;
}

export const BookedVendorsCard = ({
  vendors,
  _eventId,
  onAdd,
}: BookedVendorsCardProps) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md flex flex-col h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Booked Vendors</h3>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </div>
      <div className="mt-4 space-y-4 flex-grow">
        {vendors.length > 0 ? (
          vendors.map(({ vendor }) => (
            <div key={vendor.id} className="flex items-center gap-4">
              <Image
                src={
                  vendor.vendorProfile?.avatarUrl ??
                  "https://placehold.co/40x40"
                }
                alt={
                  vendor.vendorProfile?.companyName ?? vendor.username ?? "Vendor"
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
          <p className="text-center text-gray-500">No vendors booked yet.</p>
        )}
      </div>
      <div className="mt-4">
        <Link href={`/event/${_eventId}/board`} passHref>
          <Button variant="secondary" size="lg" className="w-full">
            <CalendarDays className="mr-2 h-4 w-4" />
            Join Moonboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
