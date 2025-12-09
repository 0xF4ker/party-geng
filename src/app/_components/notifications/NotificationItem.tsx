"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, ShoppingBag, Heart, CreditCard, Mail, FileText, CheckCircle } from "lucide-react";

import { api } from "@/trpc/react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { cn } from "@/lib/utils";

type Notification = inferRouterOutputs<AppRouter>["notification"]["getAll"][number];

export const NotificationItem = ({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) => {
  const router = useRouter();
  const utils = api.useUtils();

  const markAsRead = api.notification.markAsRead.useMutation({
    onMutate: async ({ id }) => {
        await utils.notification.getAll.cancel();
        await utils.notification.getUnreadCount.cancel();

        const previousNotifications = utils.notification.getAll.getData();
        const previousUnreadCount = utils.notification.getUnreadCount.getData();

        utils.notification.getAll.setData(undefined, (old) =>
            old?.map(n => n.id === id ? { ...n, read: true } : n) ?? []
        );
        utils.notification.getUnreadCount.setData(undefined, (old) => (old ?? 0) > 0 ? old! - 1 : 0);

        return { previousNotifications, previousUnreadCount };
    },
    onError: (err, newTodo, context) => {
        utils.notification.getAll.setData(undefined, context?.previousNotifications);
        utils.notification.getUnreadCount.setData(undefined, context?.previousUnreadCount);
    },
    onSettled: () => {
        void utils.notification.getAll.invalidate();
        void utils.notification.getUnreadCount.invalidate();
    },
  });

  const handleClick = () => {
    if (!notification.read) {
      markAsRead.mutate({ id: notification.id });
    }
    if (notification.link) {
      router.push(notification.link);
    }
    onClose();
  };

  const getIcon = () => {
    switch (notification.type) {
      case "NEW_MESSAGE":
        return <MessageSquare className="h-5 w-5 text-pink-500" />;
      case "ORDER_UPDATE":
        return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case "WISHLIST_CONTRIBUTION":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "QUOTE_PAYMENT_RECEIVED":
        return <CreditCard className="h-5 w-5 text-green-500" />;
      case "EVENT_INVITATION":
        return <Mail className="h-5 w-5 text-purple-500" />;
      case "QUOTE_RECEIVED":
        return <FileText className="h-5 w-5 text-yellow-500" />;
      case "ORDER_COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-gray-50",
        !notification.read && "bg-pink-50/50",
      )}
    >
      <div className="mt-1 flex-shrink-0">{getIcon()}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-800">{notification.message}</p>
        <p className="text-xs text-gray-500">
          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
        </p>
      </div>
      {!notification.read && (
        <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-pink-500" />
      )}
    </button>
  );
};
