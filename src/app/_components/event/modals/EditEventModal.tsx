"use client";

import React from "react";
import { api } from "@/trpc/react";
import { Loader2, X } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type routerOutput = inferRouterOutputs<AppRouter>;
type event = routerOutput["event"]["getById"];

interface EditEventModalProps {
  event: event;
  isOpen: boolean;
  onClose: () => void;
}

export const EditEventModal = ({
  event,
  isOpen,
  onClose,
}: EditEventModalProps) => {
  const utils = api.useUtils();
  const updateEvent = api.event.update.useMutation({
    onSuccess: () => {
      utils.event.getById.invalidate({ id: event.id });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("eventName") as HTMLInputElement)
      ?.value;
    const dateString = (
      form.elements.namedItem("eventDate") as HTMLInputElement
    )?.value;
    const location = (
      form.elements.namedItem("eventLocation") as HTMLInputElement
    )?.value;

    updateEvent.mutate({
      id: event.id,
      title,
      date: new Date(dateString),
      location,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label
              htmlFor="eventName"
              className="mb-1 block text-sm font-semibold text-gray-700"
            >
              Event Title
            </label>
            <input
              type="text"
              id="eventName"
              name="eventName"
              defaultValue={event.title}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="eventDate"
              className="mb-1 block text-sm font-semibold text-gray-700"
            >
              Event Date
            </label>
            <input
              type="date"
              id="eventDate"
              name="eventDate"
              defaultValue={new Date(event.date).toISOString().split("T")[0]}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="eventLocation"
              className="mb-1 block text-sm font-semibold text-gray-700"
            >
              Location (Optional)
            </label>
            <input
              type="text"
              id="eventLocation"
              name="eventLocation"
              defaultValue={event.location ?? ""}
              placeholder="e.g. Lagos, Nigeria"
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end border-t border-gray-200 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateEvent.isPending}
              className="flex items-center gap-2"
            >
              {updateEvent.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
