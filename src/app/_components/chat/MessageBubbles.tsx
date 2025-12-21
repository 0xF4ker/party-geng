// components/chat/MessageBubbles.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Clock,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Check,
  CheckCheck,
} from "lucide-react";
import type { MessageWithStatus } from "@/hooks/useChatRealtime";
import { normalizeDate } from "@/lib/dateUtils";
import { useRouter } from "next/navigation";
import Image from "next/image";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type routerOutput = inferRouterOutputs<AppRouter>;
type message = routerOutput["chat"]["getMessages"]["messages"][number];

// --- Standard Text Bubble ---

export const TextMessageBubble = ({
  message,
  isMe,
  onRetry,
  onUpdate,
  isGroupAdmin,
  isRead = false,
}: {
  message: MessageWithStatus;
  isMe: boolean;
  onRetry?: () => void;
  onUpdate?: () => void;
  isGroupAdmin?: boolean;
  isRead?: boolean;
}) => {
  const isPending = message.status === "sending";
  const isError = message.status === "error";

  // Safe access for sender
  const sender = message.sender || {};
  const senderName =
    sender.clientProfile?.name ??
    sender.vendorProfile?.companyName ??
    sender.username ??
    "...";
  const senderAvatar =
    sender.clientProfile?.avatarUrl ??
    sender.vendorProfile?.avatarUrl ??
    `https://placehold.co/40x40/ec4899/ffffff?text=${(senderName[0] ?? "?").toUpperCase()}`;

  const deleteMutation = api.chat.deleteMessage.useMutation({
    onSuccess: () => {
      toast.success("Message deleted");
      onUpdate?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = (type: "ME" | "EVERYONE") => {
    if (message.id) {
      deleteMutation.mutate({ messageId: message.id, deleteType: type });
    }
  };

  // Safe access for deleted flag
  const isDeletedForEveryone = !!message.isDeletedForEveryone;

  if (isDeletedForEveryone) {
    return (
      <div
        className={cn(
          "group flex w-full gap-2",
          isMe ? "justify-end" : "justify-start",
        )}
      >
        {!isMe && (
          <div className="flex flex-col items-center justify-end">
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gray-200">
              <Image
                src={senderAvatar}
                alt={senderName}
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}
        <div className="flex max-w-[80%] flex-col items-end gap-1">
          <div
            className={cn(
              "relative rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2 text-sm text-gray-500 italic shadow-sm",
              isMe ? "rounded-br-none" : "rounded-bl-none",
            )}
          >
            This message was deleted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex w-full gap-2",
        isMe ? "justify-end" : "justify-start",
      )}
    >
      {!isMe && (
        <div className="flex flex-col items-center justify-end">
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gray-200">
            <Image
              src={senderAvatar}
              alt={senderName}
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}
      <div className="relative flex max-w-[80%] flex-col items-end gap-1">
        {!isMe && (
          <span className="ml-1 w-full text-left text-[10px] text-gray-500">
            {senderName}
          </span>
        )}

        {/* Context Menu Trigger - Visible on Hover */}
        {!isPending && !isError && message.id && (
          <div
            className={cn(
              "absolute top-1/2 z-10 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100",
              isMe ? "-left-8" : "-right-8",
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-1 text-gray-400 hover:bg-gray-200">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleDelete("ME")}>
                  Delete for Me
                </DropdownMenuItem>
                {(isMe || isGroupAdmin) && (
                  <DropdownMenuItem
                    onClick={() => handleDelete("EVERYONE")}
                    className="text-red-600"
                  >
                    Delete for Everyone
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div
          className={cn(
            "relative rounded-2xl px-4 py-2 text-sm shadow-sm transition-all",
            isMe
              ? "rounded-br-none bg-pink-600 text-white"
              : "rounded-bl-none border border-gray-100 bg-white text-gray-800",
            isPending && "opacity-70",
            isError && "border-2 border-red-500 bg-red-50 text-red-900",
          )}
        >
          <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>

          {/* Meta Row */}
          <div
            className={cn(
              "mt-1 flex items-center justify-end gap-1 text-[10px]",
              isMe ? "text-pink-100" : "text-gray-400",
              isError && "text-red-400",
            )}
          >
            {/* STATE 1: SENDING */}
            {isPending && (
              <>
                <Clock className="h-3 w-3 animate-spin" />
                <span>Just now</span>
              </>
            )}

            {/* STATE 2: ERROR */}
            {isError && <AlertCircle className="h-3 w-3" />}

            {/* STATE 3: SENT (Standard) */}
            {!isPending && !isError && (
              <>
                <span title={normalizeDate(message.createdAt).toLocaleString()}>
                  {formatDistanceToNow(normalizeDate(message.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {isMe &&
                  (isRead ? (
                    <CheckCheck className="h-3.5 w-3.5 text-blue-200" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  ))}
              </>
            )}
          </div>
        </div>

        {/* Retry Button */}
        {isError && onRetry && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
          >
            <RefreshCw className="h-3 w-3" /> Failed to send. Retry?
          </button>
        )}
      </div>
    </div>
  );
};

// --- Quote Bubble (Interactive) ---
export const QuoteMessageBubble = ({
  message,
  isMe,
  _onUpdate,
}: {
  message: message;
  isMe: boolean;
  _onUpdate: () => void;
}) => {
  const router = useRouter();
  const quote = message.quote;
  if (!quote) return null;

  const sender = message.sender || {};
  const senderName =
    sender.clientProfile?.name ??
    sender.vendorProfile?.companyName ??
    sender.username ??
    "...";
  const senderAvatar =
    sender.clientProfile?.avatarUrl ??
    sender.vendorProfile?.avatarUrl ??
    `https://placehold.co/40x40/ec4899/ffffff?text=${(senderName[0] ?? "?").toUpperCase()}`;

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "border-green-200 bg-green-50";
      case "REJECTED":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  return (
    <div
      className={cn(
        "flex w-full gap-2",
        isMe ? "justify-end" : "justify-start",
      )}
    >
      {!isMe && (
        <div className="flex flex-col items-center justify-end">
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gray-200">
            <Image
              src={senderAvatar}
              alt={senderName}
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}
      <div>
        {!isMe && (
          <span className="mb-1 ml-1 block w-full text-left text-[10px] text-gray-500">
            {senderName}
          </span>
        )}
        <div
          className={cn(
            "w-72 overflow-hidden rounded-xl border shadow-sm",
            getStatusStyles(quote.status),
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-black/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
              <FileText className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                Quote
              </p>
              <p className="font-semibold text-gray-900">{quote.title}</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2 bg-white/50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Price:</span>
              <span className="font-bold">₦{quote.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status:</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold",
                  quote.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : quote.status === "ACCEPTED"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700",
                )}
              >
                {quote.status}
              </span>
            </div>
            <div className="pt-3">
              <button
                onClick={() => router.push(`/quote/${quote.id}`)}
                className="w-full rounded-lg bg-gray-100 py-2 text-xs font-semibold hover:bg-gray-200 disabled:opacity-50"
              >
                {quote.status === "PENDING" ? "View / Accept" : "View Details"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
