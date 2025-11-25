"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, X, Search, ShieldCheck } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

type routerOutput = inferRouterOutputs<AppRouter>;
type event = routerOutput["event"]["getById"];
type ActiveVendor = {
  id: string;
  name: string;
  service: string;
  avatarUrl: string;
  isAdded: boolean;
};

interface AddVendorModalProps {
  event: event;
  vendors: ActiveVendor[];
  isOpen: boolean;
  onClose: () => void;
}

export const AddVendorModal = ({
  event,
  vendors,
  isOpen,
  onClose,
}: AddVendorModalProps) => {
  const utils = api.useUtils();
  const addVendor = api.event.addVendor.useMutation({
    onSuccess: () => {
      void utils.event.getById.invalidate({ id: event.id });
    },
  });

  const handleAddVendor = (vendorId: string) => {
    addVendor.mutate({ eventId: event.id, vendorId });
  };

  const eventVendorIds = event.hiredVendors?.map((ev) => ev.vendor.id) ?? [];
  const vendorsWithStatus = vendors.map((v) => ({
    ...v,
    isAdded: eventVendorIds.includes(v.id),
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add Vendor to Event</DialogTitle>
        </DialogHeader>
        <div className="shrink-0 border-b border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search your active vendors..."
              className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 pr-3 pl-10 text-sm focus:outline-pink-500"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-2">
          <h4 className="mb-2 px-2 font-semibold text-gray-800">
            Vendors with Active Orders
          </h4>
          {vendorsWithStatus.length === 0 ? (
            <p className="px-2 py-8 text-center text-gray-500">
              No active vendors. Place orders first to add vendors to events.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {vendorsWithStatus.map((vendor) => (
                <li
                  key={vendor.id}
                  className="flex items-center justify-between px-2 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={vendor.avatarUrl}
                      alt={vendor.name}
                      className="h-10 w-10 rounded-full"
                      width={40}
                      height={40}
                    />
                    <div>
                      <p className="font-medium text-gray-800">{vendor.name}</p>
                      <p className="text-sm text-gray-500">{vendor.service}</p>
                    </div>
                  </div>
                  {vendor.isAdded ? (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                      <ShieldCheck className="h-5 w-5" />
                      Added
                    </span>
                  ) : (
                    <Button
                      onClick={() => handleAddVendor(vendor.id)}
                      disabled={addVendor.isPending}
                      size="sm"
                    >
                      {addVendor.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Add to Event
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
