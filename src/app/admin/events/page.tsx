"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  Search,
  MoreHorizontal,
  Trash2,
  Users,
  Briefcase,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

// --- TYPES ---
type RouterOutputs = inferRouterOutputs<AppRouter>;
type EventData = RouterOutputs["event"]["adminGetEvents"]["items"][number];

interface LocationData {
  display_name?: string;
  lat?: string;
  lon?: string;
}

// --- MAIN COMPONENT ---
export default function AdminEventsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, refetch } = api.event.adminGetEvents.useQuery({
    limit: 50,
    search: debouncedSearch,
  });

  const events: EventData[] = data?.items ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events Manager</h1>
          <p className="text-muted-foreground">
            Monitor and moderate client events.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search events..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500">
            <Calendar className="mb-2 h-10 w-10 text-gray-300" />
            <p>No events found.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 font-medium text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Vendors</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {events.map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      onSelect={() => setSelectedEvent(event)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="grid gap-4 p-4 md:hidden">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Details Sheet */}
      <EventDetailsSheet
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => {
          setSelectedEvent(null);
          void refetch();
        }}
      />
    </div>
  );
}

// --- SUB-COMPONENTS ---

const EventRow = ({
  event,
  onSelect,
}: {
  event: EventData;
  onSelect: () => void;
}) => {
  const location = event.location as unknown as LocationData | null;

  return (
    <tr className="group hover:bg-gray-50/50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
            {event.coverImage ? (
              <Image
                src={event.coverImage}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-pink-100 text-pink-500">
                <Calendar className="h-5 w-5" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{event.title}</p>
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              <span className="max-w-[150px] truncate">
                {location?.display_name ?? "No Location"}
              </span>
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-gray-200">
            {event.client.avatarUrl ? (
              <Image
                src={event.client.avatarUrl}
                alt=""
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-gray-500">
                {event.client.name?.charAt(0) ?? "C"}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {event.client.name ?? "Client"}
            </p>
            <p className="text-xs text-gray-500">
              @{event.client.user.username}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-gray-500">
        {format(new Date(event.date), "MMM d, yyyy")}
      </td>
      <td className="px-6 py-4">
        <Badge variant="secondary" className="font-normal">
          {event._count.hiredVendors} Hired
        </Badge>
      </td>
      <td className="px-6 py-4 text-right">
        <Button variant="ghost" size="sm" onClick={onSelect}>
          Review
        </Button>
      </td>
    </tr>
  );
};

const EventCard = ({
  event,
  onSelect,
}: {
  event: EventData;
  onSelect: () => void;
}) => (
  <div
    className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm active:bg-gray-50"
    onClick={onSelect}
  >
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
        {event.coverImage ? (
          <Image src={event.coverImage} alt="" fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-pink-100 text-pink-500">
            <Calendar className="h-6 w-6" />
          </div>
        )}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{event.title}</h4>
        <p className="text-xs text-gray-500">
          {format(new Date(event.date), "MMM d, yyyy")} • @
          {event.client.user.username}
        </p>
      </div>
    </div>
    <MoreHorizontal className="h-5 w-5 text-gray-400" />
  </div>
);

// --- IMPROVED DRAWER COMPONENT ---

function EventDetailsSheet({
  event,
  isOpen,
  onClose,
}: {
  event: EventData | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [deleteReason, setDeleteReason] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const utils = api.useUtils();

  const deleteMutation = api.event.adminDeleteEvent.useMutation({
    onSuccess: () => {
      toast.success("Event removed successfully");
      setShowConfirm(false);
      onClose();
      void utils.event.adminGetEvents.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleDelete = () => {
    if (!event) return;
    deleteMutation.mutate({
      id: event.id,
      reason: deleteReason || "Violates community guidelines",
    });
  };

  if (!event) return null;

  const location = event.location as unknown as LocationData | null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        {/* CHANGES MADE HERE:
          1. w-[100%] for mobile, sm:max-w-lg for desktop.
          2. p-0 initially to allow custom scroll area padding.
        */}
        <SheetContent className="flex h-full w-[100%] flex-col gap-0 border-l p-0 sm:max-w-lg">
          {/* HEADER: Sticky top */}
          <SheetHeader className="border-b px-6 py-5">
            <div className="flex items-center justify-between">
              <SheetTitle>Event Details</SheetTitle>
              {/* Optional: Add a close button if the Sheet component doesn't auto-include one */}
            </div>
            <SheetDescription>
              Reviewing Event ID:{" "}
              <span className="font-mono text-xs">
                {event.id.slice(0, 8)}...
              </span>
            </SheetDescription>
          </SheetHeader>

          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto bg-gray-50/50 px-6 py-6">
            <div className="flex flex-col gap-6">
              {/* Cover Image */}
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100 shadow-sm">
                {event.coverImage ? (
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <Calendar className="h-12 w-12 opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <h2 className="text-xl leading-tight font-bold">
                    {event.title}
                  </h2>
                  <p className="text-sm font-medium opacity-90">
                    {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              {/* Client Card */}
              <div className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border bg-gray-100">
                  {event.client.avatarUrl ? (
                    <Image
                      src={event.client.avatarUrl}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold text-gray-500">
                      {event.client.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">
                    {event.client.name ?? "Unknown Client"}
                  </p>
                  <p className="truncate text-sm text-gray-500">
                    @{event.client.user.username}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() =>
                    window.open(`/c/${event.client.user.username}`, "_blank")
                  }
                >
                  Profile
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wider text-gray-500 uppercase">
                    <Briefcase className="h-3.5 w-3.5" /> Hired Vendors
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {event._count.hiredVendors}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wider text-gray-500 uppercase">
                    <Users className="h-3.5 w-3.5" /> Guest Count
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {event._count.guestLists}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <MapPin className="h-4 w-4 text-pink-500" /> Location Details
                </h4>
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  {location?.display_name ??
                    "No specific location set for this event."}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-800">
                  <AlertTriangle className="h-4 w-4" /> Admin Actions
                </h4>
                <p className="mb-4 text-xs text-red-600/80">
                  Removing this event is permanent and cannot be undone.
                </p>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Reason for takedown (e.g. Spam, Policy violation)..."
                    className="min-h-[80px] border-red-200 bg-white focus-visible:ring-red-500"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                  />
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowConfirm(true)}
                    disabled={!deleteReason.trim()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Take Down Event
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              event <strong>&quot;{event.title}&quot;</strong>, including all
              data associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Takedown
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
