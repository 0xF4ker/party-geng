"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Plus,
  Gift,
  MoreVertical,
  X,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Loader2,
  CalendarDays,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { useUserType } from "@/hooks/useUserType";
import { useRouter } from "next/navigation";
import { AddVendorModal } from "@/app/_components/event/modals/AddVendorModal";
import LocationSearchInput, {
  type LocationSearchResult,
} from "@/components/ui/LocationSearchInput";
import { format } from "date-fns";

type routerOutput = inferRouterOutputs<AppRouter>;
type event = routerOutput["event"]["getMyEvents"]["upcoming"][number];

// --- HELPER: Date Formatter ---
const formatEventDate = (start: Date | string, end: Date | string) => {
  const s = new Date(start);
  const e = new Date(end);

  if (s.toDateString() === e.toDateString()) {
    // Same Day
    return format(s, "MMM d, yyyy");
  } else if (
    s.getMonth() === e.getMonth() &&
    s.getFullYear() === e.getFullYear()
  ) {
    // Same Month
    return `${format(s, "MMM d")} - ${format(e, "d, yyyy")}`;
  } else if (s.getFullYear() === e.getFullYear()) {
    // Same Year
    return `${format(s, "MMM d")} - ${format(e, "MMM d, yyyy")}`;
  } else {
    // Different Years
    return `${format(s, "MMM d, yyyy")} - ${format(e, "MMM d, yyyy")}`;
  }
};

const ClientEventPlannerPage = () => {
  const { user } = useAuth();
  const { isClient, loading } = useUserType();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<event | null>(null);

  // Fetch events from API
  const { data: eventsData, isLoading: eventsLoading } =
    api.event.getMyEvents.useQuery(undefined, {
      enabled: !!user,
    });

  useEffect(() => {
    if (!loading && !isClient) {
      router.push("/");
    }
  }, [loading, isClient, router]);

  const openAddVendor = (event: event) => {
    setSelectedEvent(event);
    setIsVendorModalOpen(true);
  };

  if (loading || !isClient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      <div className="container mx-auto px-4 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-gray-800">My Events</h1>
          <button
            onClick={() => setIsEventModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-pink-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-pink-700 md:w-auto"
          >
            <Plus className="h-5 w-5" />
            Create New Event
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex items-center border-b border-gray-200">
          <TabButton
            title="Upcoming Events"
            isActive={activeTab === "upcoming"}
            onClick={() => setActiveTab("upcoming")}
          />
          <TabButton
            title="Past Events"
            isActive={activeTab === "past"}
            onClick={() => setActiveTab("past")}
          />
        </div>

        {/* Loading State */}
        {eventsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
          </div>
        )}

        {/* --- Upcoming Events --- */}
        {!eventsLoading && activeTab === "upcoming" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {eventsData?.upcoming && eventsData.upcoming.length > 0 ? (
              eventsData.upcoming.map((event) => (
                <Link href={`/event/${event.id}`} key={event.id}>
                  <EventCard
                    event={event}
                    onAddVendorClick={(e) => {
                      if (e) e.preventDefault();
                      openAddVendor(event);
                    }}
                  />
                </Link>
              ))
            ) : (
              <div className="col-span-full rounded-lg border border-gray-200 bg-white p-12 text-center">
                <p className="text-gray-500">No upcoming events yet</p>
                <button
                  onClick={() => setIsEventModalOpen(true)}
                  className="mt-4 font-semibold text-pink-600 hover:text-pink-700"
                >
                  Create your first event
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- Past Events --- */}
        {!eventsLoading && activeTab === "past" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {eventsData?.past && eventsData.past.length > 0 ? (
              eventsData.past.map((event) => (
                <Link href={`/event/${event.id}`} key={event.id}>
                  <EventCard event={event} isPast={true} />
                </Link>
              ))
            ) : (
              <div className="col-span-full rounded-lg border border-gray-200 bg-white p-12 text-center">
                <p className="text-gray-500">No past events</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isEventModalOpen && (
        <CreateEventModal onClose={() => setIsEventModalOpen(false)} />
      )}

      {isVendorModalOpen && selectedEvent && (
        <AddVendorModal
          event={selectedEvent}
          isOpen={isVendorModalOpen}
          onClose={() => setIsVendorModalOpen(false)}
        />
      )}
    </div>
  );
};

// --- Sub-Components ---

const TabButton = ({
  title,
  isActive,
  onClick,
}: {
  title: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "border-b-2 px-1 py-3 text-sm font-semibold transition-colors sm:px-4 sm:text-base",
      isActive
        ? "border-pink-600 text-pink-600"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800",
    )}
  >
    {title}
  </button>
);

const EventCard = ({
  event,
  onAddVendorClick,
  isPast = false,
}: {
  event: event;
  onAddVendorClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  isPast?: boolean;
}) => {
  const wishlistItems = event.wishlist?.items ?? [];
  const wishlistCount = wishlistItems.length;
  const fulfilledCount = wishlistItems.filter(
    (item) => item.isFulfilled,
  ).length;
  const [isPublic, setIsPublic] = useState(event.isPublic);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const utils = api.useUtils();
  const updateEvent = api.event.update.useMutation({
    onSuccess: () => {
      void utils.event.getMyEvents.invalidate();
    },
  });
  const deleteEvent = api.event.delete.useMutation({
    onSuccess: () => {
      void utils.event.getMyEvents.invalidate();
    },
  });

  const handleTogglePublic = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const newIsPublic = !isPublic;
    setIsPublic(newIsPublic);
    // Note: startDate/endDate required in DB but optional in update schema
    updateEvent.mutate({ id: event.id, isPublic: newIsPublic });
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      deleteEvent.mutate({ id: event.id });
      setIsMenuOpen(false);
    }
  };

  const handleMenuToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const hiredVendors =
    event.hiredVendors?.map((ev) => ({
      id: ev.vendor.id,
      name:
        ev.vendor.vendorProfile?.companyName ?? ev.vendor.username ?? "Vendor",
      avatarUrl:
        ev.vendor.vendorProfile?.avatarUrl ??
        "https://placehold.co/40x40/ec4899/ffffff?text=V",
    })) ?? [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Image
        src={
          event.coverImage ??
          "https://placehold.co/600x300/ec4899/ffffff?text=Event"
        }
        alt={event.title}
        className={cn("h-40 w-full object-cover", isPast && "grayscale")}
        width={600}
        height={300}
      />
      <div className="flex grow flex-col p-5">
        <div className="flex items-start justify-between">
          <div>
            <p
              className={cn(
                "flex items-center gap-1 text-sm font-semibold",
                isPast ? "text-gray-500" : "text-pink-600",
              )}
            >
              <CalendarDays className="h-4 w-4" />
              {/* DISPLAY RANGE DATE */}
              {formatEventDate(event.startDate, event.endDate)}
            </p>
            <h3 className="mt-1 line-clamp-1 text-xl font-bold text-gray-800">
              {event.title}
            </h3>
          </div>

          {!isPast && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={handleMenuToggle}
                className="rounded-full p-1 text-gray-400 hover:text-gray-700"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {isMenuOpen && (
                <div
                  className="absolute top-full right-0 z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/event/${event.id}/wishlist`}>
                    <button className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                      <Gift className="h-4 w-4" /> Manage Wishlist
                    </button>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      if (onAddVendorClick) onAddVendorClick(e);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Users className="h-4 w-4" /> Add Vendor
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteEvent.isPending}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleteEvent.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete Event
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto space-y-3 pt-4">
          <div>
            <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase">
              Hired Vendors ({hiredVendors.length})
            </h4>
            <div className="flex items-center gap-2">
              {hiredVendors.slice(0, 3).map((vendor) => (
                <Image
                  key={vendor.id}
                  src={vendor.avatarUrl}
                  alt={vendor.name}
                  title={vendor.name}
                  className="h-8 w-8 rounded-full border-2 border-white ring-1 ring-gray-200"
                  width={32}
                  height={32}
                />
              ))}
              {!isPast && (
                <button
                  onClick={onAddVendorClick}
                  className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {!isPast && wishlistCount > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="text-xs text-gray-500">
                Wishlist:{" "}
                <span className="font-semibold text-gray-700">
                  {wishlistCount}
                </span>{" "}
                items
              </div>
              <div className="text-xs font-semibold text-green-600">
                {fulfilledCount} fulfilled
              </div>
            </div>
          )}
        </div>

        {!isPast && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                Make Public
              </span>
              <button
                onClick={handleTogglePublic}
                disabled={updateEvent.isPending}
              >
                {isPublic ? (
                  <ToggleRight className="h-8 w-8 text-pink-600" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CreateEventModal = ({ onClose }: { onClose: () => void }) => {
  const utils = api.useUtils();
  const [location, setLocation] = useState<LocationSearchResult | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const createEvent = api.event.create.useMutation({
    onSuccess: () => {
      void utils.event.getMyEvents.invalidate();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("eventName") as HTMLInputElement)
      ?.value;

    if (!title || !startDate || !endDate) {
      alert("Please fill in all fields");
      return;
    }

    createEvent.mutate({
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location: location,
    });
  };

  // Auto-set End Date if Start Date changes and End Date is empty or before start
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartDate(val);
    if (!endDate || new Date(endDate) < new Date(val)) {
      setEndDate(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="m-4 w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3 className="text-xl font-semibold">Create a New Event</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Event Title
            </label>
            <input
              type="text"
              name="eventName"
              placeholder="e.g. 3-Day Wedding Extravaganza"
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={handleStartChange}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split("T")[0]}
                className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Location
            </label>
            <LocationSearchInput onLocationSelect={setLocation} />
          </div>

          <div className="flex items-center justify-end border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 rounded-md px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEvent.isPending}
              className="flex items-center gap-2 rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
            >
              {createEvent.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientEventPlannerPage;
