"use client";

import React from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
  const isPending = message.eventInvitation.status === "PENDING";

  const renderContent = () => {
    if (isLoadingEvent) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (!event) {
      return (
        <p className="text-sm text-red-500">Event details not available.</p>
      );
    }

    const invitationStatus = message.eventInvitation.status;

    return (
      <div className="max-w-sm rounded-lg border border-gray-200 bg-white p-3 shadow-md">
        <p className="font-semibold text-gray-800">Event Invitation</p>
        <p className="text-sm text-gray-600">
          You&apos;ve been invited to join the event:
        </p>
        <p className="my-2 font-bold text-pink-600">
          &quot;{event.title}&quot;
        </p>

        {isMe && (
          <p className="mt-2 text-xs text-gray-500">
            Waiting for vendor to respond.
          </p>
        )}

        {!isMe && isInvitedVendor && (
          <>
            {isPending ? (
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus("ACCEPTED")}
                  disabled={updateInvitationStatus.isPending}
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
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUpdateStatus("REJECTED")}
                  disabled={updateInvitationStatus.isPending}
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
              <p
                className={`mt-3 text-sm font-semibold ${invitationStatus === "ACCEPTED" ? "text-green-600" : "text-red-600"}`}
              >
                You have {invitationStatus.toLowerCase()} this invitation.
              </p>
            )}
          </>
        )}
        {!isMe && !isInvitedVendor && (
          <p className="mt-2 text-xs text-gray-500">
            This invitation was sent to another vendor.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className="flex items-end gap-2">
        {!isMe && (
          <div className="h-8 w-8 shrink-0 rounded-full bg-gray-300">
            {/* Avatar could go here */}
          </div>
        )}
        <div>
          {renderContent()}
          <p className="mt-1 px-1 text-xs text-gray-400">
            {new Date(message.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};
