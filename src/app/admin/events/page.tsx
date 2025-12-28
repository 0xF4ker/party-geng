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
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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

// --- STRICT TYPE INFERENCE ---
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

type RouterOutputs = inferRouterOutputs<AppRouter>;
// This extracts the exact array item type returned by your 'adminGetEvents' procedure
type EventData = RouterOutputs["event"]["adminGetEvents"]["items"][number];

// Helper type for the Location JSON structure
interface LocationData {
  display_name?: string;
  lat?: string;
  lon?: string;
}

export default function AdminEventsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  // Simple debounce
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
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events Manager</h1>
          <p className="text-muted-foreground">
            Monitor and moderate client events.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
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

// --- Sub-Components ---

const EventRow = ({
  event,
  onSelect,
}: {
  event: EventData;
  onSelect: () => void;
}) => {
  // Safe cast for location since Prisma returns JsonValue
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

// --- Details & Actions Sheet ---

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
  const utils = api.useContext();

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

  // Safe cast for location display in sheet
  const location = event.location as unknown as LocationData | null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-[400px] overflow-y-auto sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Event Details</SheetTitle>
            <SheetDescription>ID: {event.id}</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Cover Image */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
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
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 p-4 text-white">
                <h2 className="text-xl font-bold">{event.title}</h2>
                <p className="text-sm opacity-90">
                  {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Client Info */}
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200">
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
              <div className="grow">
                <p className="font-semibold text-gray-900">
                  {event.client.name ?? "Unknown Client"}
                </p>
                <p className="text-sm text-gray-500">
                  @{event.client.user.username}
                </p>
                <p className="text-xs text-gray-400">
                  {event.client.user.email}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`/c/${event.client.user.username}`, "_blank")
                }
              >
                View Profile
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Briefcase className="h-4 w-4" /> Vendors
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {event._count.hiredVendors}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-500">
                  <Users className="h-4 w-4" /> Guest Lists
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {event._count.guestLists}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <MapPin className="h-4 w-4 text-pink-500" /> Location
              </h4>
              <p className="text-sm text-gray-600">
                {location?.display_name ?? "No location details provided."}
              </p>
            </div>

            {/* Takedown Form */}
            <div className="rounded-lg border border-red-100 bg-red-50 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-800">
                <AlertTriangle className="h-4 w-4" /> Danger Zone
              </h4>
              <p className="mb-4 text-xs text-red-600">
                Removing this event is permanent. It will delete all associated
                guest lists, budgets, and chats.
              </p>
              <div className="space-y-3">
                <Textarea
                  placeholder="Reason for takedown (e.g. Spam, Inappropriate content)"
                  className="bg-white"
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
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              event <strong>&quot;{event.title}&quot;</strong> and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Confirm Takedown
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}