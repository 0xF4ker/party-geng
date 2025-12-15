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
import { CalendarIcon, MapPinIcon, PencilIcon, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventDetails = RouterOutput["event"]["getById"];

interface EventHeaderProps {
  event: EventDetails;
  onEdit: () => void;
}

export const EventHeader = ({ event, onEdit }: EventHeaderProps) => {
  const router = useRouter();
  const utils = api.useUtils();
  const [isPublic, setIsPublic] = useState(event.isPublic);

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
    const newIsPublic = !isPublic;
    setIsPublic(newIsPublic);
    updateEvent.mutate({ id: event.id, isPublic: newIsPublic });
  };

  return (
    <>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <div className="mb-2 flex items-center gap-3">
               <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                {event.title}
              </h1>
              {/* Public Toggle */}
              <div className="flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-sm font-medium">
                <span className={isPublic ? "text-pink-600" : "text-gray-500"}>
                  {isPublic ? "Public" : "Private"}
                </span>
                <button
                  onClick={handleTogglePublic}
                  disabled={updateEvent.isPending}
                  className="flex items-center text-gray-400 hover:text-pink-600 disabled:opacity-50"
                >
                  {updateEvent.isPending ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : isPublic ? (
                    <ToggleRight className="h-6 w-6 text-pink-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
           
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <span className="font-medium">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  <span className="font-medium">{(event.location as unknown as {display_name: string})?.display_name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={onEdit}>
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit Event
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleteEvent.isPending}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Event
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    event and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteEvent.mutate({ id: event.id })}
                  >
                    Continue
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
