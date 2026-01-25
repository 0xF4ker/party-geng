"use client";

import React from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, CalendarHeart, MapPin, Clock } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export type MessageWithInvitation =
  inferRouterOutputs<AppRouter>["chat"]["getMessages"]["messages"][number] & {
    eventInvitation: NonNullable<
      inferRouterOutputs<AppRouter>["chat"]["getMessages"]["messages"][number]["eventInvitation"]
    >;
  };

interface EventInvitationBubbleProps {
  message: MessageWithInvitation;
  isMe: boolean;
  onUpdate: () => void;
}

export const EventInvitationMessageBubble = ({
  message,
  isMe,
  onUpdate,
}: EventInvitationBubbleProps) => {
  const { user } = useAuth();
  const { data: event, isLoading: isLoadingEvent } = api.event.getById.useQuery(
    { id: message.eventInvitation.eventId },
  );

  const utils = api.useUtils();
  const updateInvitationStatus = api.eventInvitation.updateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Invitation ${data.status.toLowerCase()}.`);
      onUpdate();
      void utils.event.getById.invalidate({
        id: message.eventInvitation.eventId,
      });
      void utils.chat.getConversations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleUpdateStatus = (status: "ACCEPTED" | "REJECTED") => {
    updateInvitationStatus.mutate({
      id: message.eventInvitation.id,
      status: status,
    });
  };

  const isInvitedVendor = user?.id === message.eventInvitation.vendorId;
  const status = message.eventInvitation.status;
  const isPending = status === "PENDING";

  // Helper to extract location string
  const getLocationString = (location: unknown) => {
    if (
      typeof location === "object" &&
      location !== null &&
      "display_name" in location
    ) {
      // Shorten the display name if it's too long
      const name = (location as { display_name: string }).display_name;
      return name.split(",").slice(0, 2).join(", ");
    }
    return "TBD";
  };

  // Helper for date range formatting
  const formatEventDate = (start: Date | string, end: Date | string) => {
    const s = new Date(start);
    const e = new Date(end);

    if (s.toDateString() === e.toDateString()) {
      // Same day: Show Date + Time
      return format(s, "EEE, MMM d, yyyy • h:mm a");
    } else {
      // Multi-day: Show Date Range (omit time to save space)
      if (s.getFullYear() === e.getFullYear()) {
        return `${format(s, "MMM d")} - ${format(e, "MMM d, yyyy")}`;
      }
      return `${format(s, "MMM d, yyyy")} - ${format(e, "MMM d, yyyy")}`;
    }
  };

  if (isLoadingEvent) {
    return (
      <div
        className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
      >
        <div className="flex h-32 w-64 items-center justify-center rounded-2xl bg-gray-100">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div
        className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
      >
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          Event details unavailable.
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
      <div className="relative max-w-sm overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-shadow hover:shadow-lg">
        {/* Decorative Top Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-pink-500 to-purple-600" />

        <div className="p-5">
          {/* Header */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-600">
              <CalendarHeart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                {isMe ? "Invitation Sent" : "You're Invited!"}
              </p>
              <h3 className="line-clamp-1 text-lg leading-tight font-bold text-gray-900">
                {event.title}
              </h3>
            </div>
          </div>

          {/* Event Details */}
          <div className="mb-5 space-y-2 rounded-lg bg-gray-50 p-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4 text-pink-500" />
              {/* UPDATED DATE DISPLAY */}
              <span>{formatEventDate(event.startDate, event.endDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4 text-pink-500" />
              <span className="truncate">
                {getLocationString(event.location)}
              </span>
            </div>
          </div>

          {/* Actions / Status */}
          {isInvitedVendor ? (
            <>
              {isPending ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleUpdateStatus("ACCEPTED")}
                    disabled={updateInvitationStatus.isPending}
                    className="w-full bg-pink-600 text-white hover:bg-pink-700"
                  >
                    {updateInvitationStatus.isPending &&
                    updateInvitationStatus.variables?.status === "ACCEPTED" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus("REJECTED")}
                    disabled={updateInvitationStatus.isPending}
                    className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-red-600"
                  >
                    {updateInvitationStatus.isPending &&
                    updateInvitationStatus.variables?.status === "REJECTED" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Decline
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold",
                    status === "ACCEPTED"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700",
                  )}
                >
                  {status === "ACCEPTED" ? (
                    <>
                      <Check className="h-4 w-4" /> Accepted
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" /> Declined
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            // View for Sender (Client) or 3rd party
            <div className="text-center">
              {isPending ? (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 italic">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Waiting for response...
                </div>
              ) : (
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                    status === "ACCEPTED"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800",
                  )}
                >
                  {status === "ACCEPTED" ? "Accepted" : "Declined"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
