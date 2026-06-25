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
const formatEventDate = (start: Date | string, end: Date | string) => {
  const s = new Date(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) {
    return format(s, "MMM d, yyyy");
  } else if (
    s.getMonth() === e.getMonth() &&
    s.getFullYear() === e.getFullYear()
  ) {
    return `${format(s, "MMM d")} - ${format(e, "d, yyyy")}`;
  } else if (s.getFullYear() === e.getFullYear()) {
    return `${format(s, "MMM d")} - ${format(e, "MMM d, yyyy")}`;
  } else {
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
    <div className="bg-transparent pt-[122px] text-[var(--l-text)] lg:pt-[127px]">
      <div className="container mx-auto px-4 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-[var(--l-text)]">My Events</h1>
          <button
            onClick={() => setIsEventModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[var(--l-brand-pink)] to-[var(--l-brand-purple)] shadow-[0_4px_16px_rgba(247,37,133,0.3)] px-5 py-3 font-semibold text-white transition-[transform,box-shadow] duration-200 hover:scale-[1.02] md:w-auto"
          >
            <Plus className="h-5 w-5" />
            Create New Event
          </button>
        </div>
        {/* Tab Navigation */}
        <div className="mb-6 flex items-center gap-2 border-b border-[var(--l-border)] pb-2">
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
              <div className="col-span-full l-card p-12 text-center">
                <p className="text-[var(--l-text-muted)]">No upcoming events yet</p>
                <button
                  onClick={() => setIsEventModalOpen(true)}
                  className="mt-4 font-semibold text-[var(--l-brand-pink)] hover:text-white transition-colors"
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
              <div className="col-span-full l-card p-12 text-center">
                <p className="text-[var(--l-text-muted)]">No past events</p>
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
      "rounded-full px-4 py-2 text-sm font-semibold transition-all sm:text-base",
      isActive
        ? "bg-[rgba(247,37,133,0.15)] text-[var(--l-brand-pink)] border border-[var(--l-brand-pink)] shadow-[0_0_12px_rgba(247,37,133,0.3)]"
        : "border border-transparent text-[var(--l-text-muted)] hover:bg-black/5 hover:text-[var(--l-text)]",
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
    <div className="flex h-full flex-col overflow-hidden l-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
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
                isPast ? "text-[var(--l-text-muted)]" : "text-[var(--l-brand-pink)]",
              )}
            >
              <CalendarDays className="h-4 w-4" />
              {/* DISPLAY RANGE DATE */}
              {formatEventDate(event.startDate, event.endDate)}
            </p>
            <h3 className="mt-1 line-clamp-1 text-xl font-bold text-[var(--l-text)]">
              {event.title}
            </h3>
          </div>
          {!isPast && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={handleMenuToggle}
                className="rounded-full p-1 text-[var(--l-text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {isMenuOpen && (
                <div
                  className="absolute top-full right-0 z-10 mt-1 w-48 rounded-xl border border-[var(--l-border)] bg-[var(--l-surface-raised)] shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/event/${event.id}/wishlist`}>
                    <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--l-text)] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                      <Gift className="h-4 w-4 text-[var(--l-text-muted)]" /> Manage Wishlist
                    </button>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      if (onAddVendorClick) onAddVendorClick(e);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--l-text)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  >
                    <Users className="h-4 w-4 text-[var(--l-text-muted)]" /> Add Vendor
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteEvent.isPending}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#ff4d4d] hover:bg-[rgba(255,77,77,0.1)] transition-colors disabled:opacity-50"
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
            <h4 className="mb-2 text-[10px] font-bold text-[var(--l-text-muted)] uppercase tracking-wider">
              Hired Vendors ({hiredVendors.length})
            </h4>
            <div className="flex items-center gap-2">
              {hiredVendors.slice(0, 3).map((vendor) => (
                <Image
                  key={vendor.id}
                  src={vendor.avatarUrl}
                  alt={vendor.name}
                  title={vendor.name}
                  className="h-8 w-8 rounded-full border-2 border-[var(--l-surface-raised)] ring-1 ring-[var(--l-border)]"
                  width={32}
                  height={32}
                />
              ))}
              {!isPast && (
                <button
                  onClick={onAddVendorClick}
                  className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--l-surface-raised)] bg-[rgba(255,255,255,0.05)] text-[var(--l-text-muted)] ring-1 ring-[var(--l-border)] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {!isPast && wishlistCount > 0 && (
            <div className="flex items-center justify-between border-t border-[var(--l-border)] pt-3">
              <div className="text-xs text-[var(--l-text-muted)]">
                Wishlist:{" "}
                <span className="font-semibold text-white">
                  {wishlistCount}
                </span>{" "}
                items
              </div>
              <div className="text-xs font-semibold text-[#16a34a]">
                {fulfilledCount} fulfilled
              </div>
            </div>
          )}
        </div>
        {!isPast && (
          <div className="mt-4 border-t border-[var(--l-border)] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--l-text-muted)]">
                Make Public
              </span>
              <button
                onClick={handleTogglePublic}
                disabled={updateEvent.isPending}
                className="transition-transform hover:scale-110"
              >
                {isPublic ? (
                  <ToggleRight className="h-8 w-8 text-[var(--l-brand-pink)] drop-shadow-[0_0_8px_rgba(247,37,133,0.5)]" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-[var(--l-text-muted)]" />
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
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartDate(val);
    if (!endDate || new Date(endDate) < new Date(val)) {
      setEndDate(val);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="m-4 w-full max-w-lg rounded-2xl bg-white border border-[var(--l-border)] shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-[var(--l-border)] p-5">
          <h3 className="text-xl font-bold text-[var(--l-text)]">Create a New Event</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--l-text-muted)] hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--l-text)]">
              Event Title
            </label>
            <input
              type="text"
              name="eventName"
              placeholder="e.g. 3-Day Wedding Extravaganza"
              className="w-full rounded-xl border border-[var(--l-border)] bg-gray-50/50 p-3 text-[var(--l-text)] placeholder-gray-400 focus:border-[var(--l-brand-pink)] focus:outline-none focus:ring-1 focus:ring-[var(--l-brand-pink)]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--l-text)]">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={handleStartChange}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch (err) {
                    console.error("Native datepicker not supported", err);
                  }
                }}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border border-[var(--l-border)] bg-gray-50/50 p-3 text-[var(--l-text)] focus:border-[var(--l-brand-pink)] focus:outline-none focus:ring-1 focus:ring-[var(--l-brand-pink)] [color-scheme:light] cursor-pointer"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--l-text)]">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch (err) {
                    console.error("Native datepicker not supported", err);
                  }
                }}
                min={startDate || new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border border-[var(--l-border)] bg-gray-50/50 p-3 text-[var(--l-text)] focus:border-[var(--l-brand-pink)] focus:outline-none focus:ring-1 focus:ring-[var(--l-brand-pink)] [color-scheme:light] cursor-pointer"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--l-text)]">
              Location
            </label>
            <LocationSearchInput onLocationSelect={setLocation} />
          </div>
          <div className="flex items-center justify-end border-t border-[var(--l-border)] pt-5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="mr-3 rounded-xl px-5 py-2.5 text-sm font-semibold text-[var(--l-text-muted)] hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEvent.isPending}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--l-brand-pink)] to-[var(--l-brand-purple)] px-6 py-2.5 text-sm font-bold text-white hover:scale-105 transition-[transform,box-shadow] duration-200 shadow-[0_4px_16px_rgba(247,37,133,0.3)] disabled:opacity-50"
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
