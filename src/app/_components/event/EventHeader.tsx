"use client";

import React, { useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  MapPinIcon,
  PencilIcon,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Lock,
} from "lucide-react";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventDetails = RouterOutput["event"]["getById"];

interface EventHeaderProps {
  event: EventDetails;
  onEdit: () => void;
}

// Helper to check if event is past
const isEventPast = (endDate: Date | string) => {
  return new Date(endDate) < new Date();
};

const formatEventDateRange = (start: Date | string, end: Date | string) => {
  const s = new Date(start);
  const e = new Date(end);

  if (s.toDateString() === e.toDateString()) {
    return format(s, "MMMM d, yyyy");
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

export const EventHeader = ({ event, onEdit }: EventHeaderProps) => {
  const router = useRouter();
  const utils = api.useUtils();
  const [isPublic, setIsPublic] = useState(event.isPublic);
  const isPast = isEventPast(event.endDate);

  const updateEvent = api.event.update.useMutation({
    onSuccess: () => {
      void utils.event.getById.invalidate({ id: event.id });
    },
  });

  const deleteEvent = api.event.delete.useMutation({
    onSuccess: () => {
      router.push("/manage_events");
    },
  });

  const handleTogglePublic = () => {
    // We allow toggling public status even if the event is past
    const newIsPublic = !isPublic;
    setIsPublic(newIsPublic);
    updateEvent.mutate({ id: event.id, isPublic: newIsPublic });
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-lg bg-white p-6 shadow-md">
        {/* Concluded Banner */}
        {isPast && (
          <div className="absolute top-0 right-0 flex items-center gap-1 rounded-bl-lg border-b border-l border-gray-200 bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
            <Lock className="h-3 w-3" /> Event Concluded
          </div>
        )}

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="w-full">
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                {event.title}
              </h1>

              {/* Public Toggle Badge - Always Active */}
              <div className="flex w-fit items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-sm font-medium">
                <span className={isPublic ? "text-pink-600" : "text-gray-500"}>
                  {isPublic ? "Public Event" : "Private Event"}
                </span>
                <button
                  onClick={handleTogglePublic}
                  disabled={updateEvent.isPending}
                  className="flex items-center text-gray-400 hover:text-pink-600 disabled:opacity-50"
                >
                  {updateEvent.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isPublic ? (
                    <ToggleRight className="h-6 w-6 text-pink-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-gray-500">
              <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-1.5">
                <CalendarDays className="h-5 w-5 text-pink-500" />
                <span className="font-medium text-gray-700">
                  {formatEventDateRange(event.startDate, event.endDate)}
                </span>
              </div>

              {event.location && (
                <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-1.5">
                  <MapPinIcon className="h-5 w-5 text-pink-500" />
                  <span className="font-medium text-gray-700">
                    {
                      (
                        event.location as unknown as {
                          display_name: string;
                        }
                      )?.display_name
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex w-full gap-2 pt-6 sm:mt-0 sm:w-auto sm:pt-0">
            <Button
              onClick={onEdit}
              variant="outline"
              className="flex-1 sm:flex-none"
              disabled={isPast} // Edit details remains disabled
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={deleteEvent.isPending}
                  className="flex-1 sm:flex-none"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your event <strong>&quot;{event.title}&quot;</strong> and
                    remove all associated data (guest lists, budget, etc.) from
                    our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => deleteEvent.mutate({ id: event.id })}
                  >
                    {deleteEvent.isPending ? "Deleting..." : "Delete Event"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </>
  );
};
