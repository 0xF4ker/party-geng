"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { api } from "@/trpc/react";
import { Loader2, Search, Check, ChevronDown, X } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import LocationSearchInput, {
  type LocationSearchResult,
} from "@/components/ui/LocationSearchInput";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Event = RouterOutput["event"]["getById"];

interface AddVendorModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

export const AddVendorModal = ({
  event,
  isOpen,
  onClose,
}: AddVendorModalProps) => {
  const utils = api.useUtils();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [location, setLocation] = useState<LocationSearchResult | null>(null);
  const [radius, setRadius] = useState(5000); // 5km

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { data: categoriesData, isLoading: isLoadingCategories } =
    api.category.getAll.useQuery();

  const allServices = useMemo(() => {
    return (
      categoriesData?.flatMap((cat) =>
        cat.services.map((s) => ({ ...s, categoryName: cat.name })),
      ) ?? []
    );
  }, [categoriesData]);

  const { data: searchResults, isLoading: isSearching } =
    api.vendor.searchVendors.useQuery({
      query: debouncedSearchQuery,
      serviceIds: selectedServices,
      location: location
        ? {
            lat: parseFloat(location.lat),
            lon: parseFloat(location.lon),
            radius,
          }
        : undefined,
      limit: 20,
    });

  const sendInvitation = api.eventInvitation.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Invitation sent to ${data.vendor.username}!`);
      // I could add optimistic updates here
      void utils.vendor.searchVendors.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleInviteVendor = (vendorId: string) => {
    sendInvitation.mutate({ eventId: event.id, vendorId });
  };

  const hiredVendorIds = useMemo(
    () => event.hiredVendors?.map((ev) => ev.vendor.id) ?? [],
    [event.hiredVendors],
  );
  // TODO: Also check for pending invitations and disable the button

  const toggleService = (serviceId: number) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  const selectedServiceNames = useMemo(() => {
    return allServices
      .filter((s) => selectedServices.includes(s.id))
      .map((s) => s.name);
  }, [allServices, selectedServices]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[80vh] flex-col sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Invite a Vendor to Your Event</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 border-b border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors by name, company, or title..."
              className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 pr-3 pl-10 text-sm focus:outline-pink-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Services <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 w-full overflow-y-auto">
                  {isLoadingCategories ? (
                    <DropdownMenuItem>Loading...</DropdownMenuItem>
                  ) : (
                    allServices.map((service) => (
                      <DropdownMenuItem
                        key={service.id}
                        onSelect={(e) => e.preventDefault()}
                        onClick={() => toggleService(service.id)}
                      >
                        <div
                          className={`border-primary mr-2 h-4 w-4 border ${selectedServices.includes(service.id) ? "bg-primary text-primary-foreground" : ""}`}
                        >
                          {selectedServices.includes(service.id) && (
                            <Check className="h-4 w-4" />
                          )}
                        </div>
                        <span>
                          {service.name}{" "}
                          <span className="text-muted-foreground text-xs">
                            ({service.categoryName})
                          </span>
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedServiceNames.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-1 rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-800"
                  >
                    {name}
                    <button
                      onClick={() => {
                        const service = allServices.find(
                          (s) => s.name === name,
                        );
                        if (service) toggleService(service.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <LocationSearchInput
                onLocationSelect={setLocation}
                initialValue={location?.display_name}
              />
              {location && (
                <div>
                  <label className="text-xs font-medium">
                    Radius: {(radius / 1000).toFixed(1)} km
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="50000"
                    step="1000"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isSearching && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            </div>
          )}

          {!isSearching &&
          (!searchResults || searchResults.vendors.length === 0) ? (
            <p className="px-2 py-8 text-center text-gray-500">
              No vendors found. Try adjusting your search or filters.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {searchResults?.vendors.map((vendor) => (
                <li
                  key={vendor.id}
                  className="flex items-center justify-between px-2 py-3"
                >
                  <Link
                    href={`/v/${vendor.username}`}
                    target="_blank"
                    className="group flex items-center gap-3"
                  >
                    <Image
                      src={
                        vendor.avatarUrl ??
                        "https://placehold.co/40x40/ec4899/ffffff?text=V"
                      }
                      alt={vendor.username}
                      className="h-10 w-10 rounded-full"
                      width={40}
                      height={40}
                    />
                    <div>
                      <p className="font-medium text-gray-800 group-hover:text-pink-600">
                        {vendor.companyName ?? vendor.username}
                      </p>
                      <p className="text-sm text-gray-500">
                        {vendor.title ?? "Vendor"}
                      </p>
                    </div>
                  </Link>
                  {hiredVendorIds.includes(vendor.user.id) ? (
                    <span className="text-sm font-semibold text-green-600">
                      Hired
                    </span>
                  ) : (
                    <Button
                      onClick={() => handleInviteVendor(vendor.user.id)}
                      disabled={
                        sendInvitation.isPending &&
                        sendInvitation.variables?.vendorId === vendor.user.id
                      }
                      size="sm"
                    >
                      {sendInvitation.isPending &&
                        sendInvitation.variables?.vendorId ===
                          vendor.user.id && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                      Invite
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
