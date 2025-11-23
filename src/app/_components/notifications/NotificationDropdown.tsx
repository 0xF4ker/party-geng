"use client";

import React, { useState, useMemo } from "react";
import { Bell, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/trpc/react";
import { NotificationItem } from "./NotificationItem";
import { GroupedNotificationItem } from "./GroupedNotificationItem";
import { cn } from "@/lib/utils";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Button } from "@/components/ui/button";

type Notification = inferRouterOutputs<AppRouter>["notification"]["getAll"][number];

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
    onSuccess: () => {
      void utils.notification.invalidate();
    },
  });

  const groupedNotifications = useMemo(() => {
    if (!notifications) return {};
    return notifications.reduce(
      (acc, notif) => {
                  if (notif.type === "NEW_MESSAGE" && notif.conversationId) {
                    acc[notif.conversationId] ??= [];
                    acc[notif.conversationId]!.push(notif);        } else {
          // Other notifications get their own group by ID
          acc[notif.id] = [notif];
        }
        return acc;
      },
      {} as Record<string, Notification[]>,
    );
  }, [notifications]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)}>
          <Bell className="h-6 w-6" />
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-xl border-gray-200 bg-white p-0 shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h3 className="font-semibold">Notifications</h3>
          <button
            onClick={() => markAllAsRead.mutate()}
            className="text-sm font-medium text-pink-600 hover:text-pink-800 disabled:text-gray-400"
            disabled={
              markAllAsRead.isPending || (unreadCount ?? 0) === 0
            }
          >
            Mark all as read
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin text-pink-500" />
            </div>
          ) : Object.keys(groupedNotifications).length > 0 ? (
            Object.values(groupedNotifications).map((group) => {
              if (group.length > 1) {
                return (
                  <GroupedNotificationItem
                    key={group[0]!.conversationId}
                    notifications={group}
                    onClose={() => setIsOpen(false)}
                  />
                );
              }
              const notif = group[0]!;
              return (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onClose={() => setIsOpen(false)}
                />
              );
            })
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
