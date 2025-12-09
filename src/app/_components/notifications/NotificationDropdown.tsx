"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { BellIcon } from "@heroicons/react/24/solid";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/trpc/react";
import { NotificationItem } from "./NotificationItem";
import { cn } from "@/lib/utils";

export const NotificationDropdown = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications, isLoading } = api.notification.getAll.useQuery(
    undefined,
    {
      enabled: isOpen,
      refetchInterval: 60000, // Refetch every minute
    },
  );
  const { data: unreadCount } = api.notification.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 60000,
    },
  );
  const utils = api.useUtils();

  const markAllAsRead = api.notification.markAllAsRead.useMutation({
    onMutate: async () => {
      await utils.notification.getAll.cancel();
      await utils.notification.getUnreadCount.cancel();

      const previousNotifications = utils.notification.getAll.getData();
      const previousUnreadCount = utils.notification.getUnreadCount.getData();

      utils.notification.getAll.setData(
        undefined,
        (old) => old?.map((n) => ({ ...n, read: true })) ?? [],
      );
      utils.notification.getUnreadCount.setData(undefined, 0);

      return { previousNotifications, previousUnreadCount };
    },
    onError: (err, newTodo, context) => {
      utils.notification.getAll.setData(
        undefined,
        context?.previousNotifications,
      );
      utils.notification.getUnreadCount.setData(
        undefined,
        context?.previousUnreadCount,
      );
    },
    onSettled: () => {
      void utils.notification.getAll.invalidate();
      void utils.notification.getUnreadCount.invalidate();
    },
  });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-pink-600",
            className,
          )}
        >
          <BellIcon className="h-6 w-6" />
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-xl border-gray-200 bg-white p-0 shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h3 className="font-semibold">Notifications</h3>
          <button
            onClick={() => markAllAsRead.mutate()}
            className="text-sm font-medium text-pink-600 hover:text-pink-800 disabled:text-gray-400"
            disabled={markAllAsRead.isPending || (unreadCount ?? 0) === 0}
          >
            Mark all as read
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin text-pink-500" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onClose={() => setIsOpen(false)}
              />
            ))
          ) : (
            <p className="p-8 text-center text-sm text-gray-500">
              You have no notifications.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
