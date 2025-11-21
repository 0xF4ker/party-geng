"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";

import { api } from "@/trpc/react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { cn } from "@/lib/utils";

type Notification = inferRouterOutputs<AppRouter>["notification"]["getAll"][number];

export const GroupedNotificationItem = ({
  notifications,
  onClose,
}: {
  notifications: Notification[];
  onClose: () => void;
}) => {
  const router = useRouter();
  const utils = api.useUtils();

  const markManyAsRead = api.notification.markManyAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.invalidate();
    },
  });

  if (notifications.length === 0) {
    return null;
  }

  const firstNotif = notifications[0]!;
  const count = notifications.length;
  const senderName = firstNotif.message.replace("You have a new message from ", "");

  const handleClick = () => {
    const ids = notifications.map((n) => n.id);
    markManyAsRead.mutate({ ids });
    if (firstNotif.link) {
      router.push(firstNotif.link);
    }
    onClose();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-gray-50",
        "bg-pink-50/50",
      )}
    >
      <div className="mt-1 flex-shrink-0">
        <MessageSquare className="h-5 w-5 text-pink-500" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-800">
          You have {count} new messages from {senderName}
        </p>
        <p className="text-xs text-gray-500">
          {formatDistanceToNow(firstNotif.createdAt, { addSuffix: true })}
        </p>
      </div>
      <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
        {count}
      </div>
    </button>
  );
};
