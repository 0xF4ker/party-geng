"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LocationSearchInput, {
  type LocationSearchResult,
} from "@/components/ui/LocationSearchInput";

type routerOutput = inferRouterOutputs<AppRouter>;
type Event = routerOutput["event"]["getById"];

interface EditEventModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

export const EditEventModal = ({
  event,
  isOpen,
  onClose,
}: EditEventModalProps) => {
  const utils = api.useUtils();
  const [location, setLocation] = useState<LocationSearchResult | null>(
    (event.location as unknown as LocationSearchResult) ?? null,
  );

  // Use controlled state for dates to handle validation logic
  const [startDate, setStartDate] = useState(
    new Date(event.startDate).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(event.endDate).toISOString().split("T")[0]
  );

  // Sync state if event prop changes (e.g. re-opening modal)
  useEffect(() => {
    if (isOpen) {
      setStartDate(new Date(event.startDate).toISOString().split("T")[0]);
      setEndDate(new Date(event.endDate).toISOString().split("T")[0]);
      setLocation((event.location as unknown as LocationSearchResult) ?? null);
    }
  }, [isOpen, event]);

  const updateEvent = api.event.update.useMutation({
    onSuccess: () => {
      void utils.event.getById.invalidate({ id: event.id });
      onClose();
    },
  });

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    
    // If new start date is after current end date, push end date forward
    if (newStart > endDate) {
      setEndDate(newStart);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("eventName") as HTMLInputElement)
      ?.value;

    if (!title || !startDate || !endDate) return;

    updateEvent.mutate({
      id: event.id,
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Event Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          
          {/* Title */}
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

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="mb-1 block text-sm font-semibold text-gray-700"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={startDate}
                onChange={handleStartDateChange}
                // Optional: prevent picking past dates?
                // min={new Date().toISOString().split("T")[0]} 
                className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="mb-1 block text-sm font-semibold text-gray-700"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate} // Constraint: End date cannot be before start date
                className="w-full rounded-md border border-gray-300 p-2 focus:outline-pink-500"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="eventLocation"
              className="mb-1 block text-sm font-semibold text-gray-700"
            >
              Location (Optional)
            </label>
            <LocationSearchInput
              initialValue={location?.display_name}
              onLocationSelect={setLocation}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end border-t border-gray-200 pt-4 mt-2">
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
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white"
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
