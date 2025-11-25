// components/chat/ConversationList.tsx
import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type routerOutput = inferRouterOutputs<AppRouter>;
type conversationOutput = routerOutput["chat"]["getConversations"][number];

export const ConversationList = ({
  conversations,
  selectedId,
  onSelect,
  currentUserId,
}: {
  conversations: conversationOutput[];
  selectedId?: string;
  onSelect: (c: conversationOutput) => void;
  currentUserId: string;
}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (c.isGroup) {
        return c.clientEvent?.title
          .toLowerCase()
          .includes(search.toLowerCase());
      }
      const other = c.participants.find((p) => p.id !== currentUserId);
      const name =
        other?.vendorProfile?.companyName ??
        other?.clientProfile?.name ??
        other?.username ??
        "";
      return name.toLowerCase().includes(search.toLowerCase());
    });
  }, [conversations, search, currentUserId]);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="border-b border-gray-100 p-4">
        <h2 className="mb-4 text-xl font-bold">Messages</h2>
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-xl border border-transparent bg-gray-50 py-2 pl-10 text-sm transition-all outline-none focus:border-pink-200 focus:bg-white"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((convo) => {
          const isGroup = convo.isGroup;
          let name: string;
          let avatar: string | null | undefined;

          if (isGroup) {
            name = convo.clientEvent?.title ?? "Event Group Chat";
            avatar = null; // Or a default group icon
          } else {
            const other = convo.participants.find(
              (p) => p.id !== currentUserId,
            );
            name =
              other?.vendorProfile?.companyName ??
              other?.clientProfile?.name ??
              "User";
            avatar =
              other?.vendorProfile?.avatarUrl ?? other?.clientProfile?.avatarUrl;
          }

          const lastMsg = convo.messages[0];
          const hasUnread = convo.unreadCount > 0;

          return (
            <button
              key={convo.id}
              onClick={() => onSelect(convo)}
              className={cn(
                "flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-gray-50",
                selectedId === convo.id &&
                  "border-r-4 border-pink-600 bg-pink-50/60",
              )}
            >
              <div className="relative shrink-0">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full bg-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 font-bold text-pink-700">
                    {isGroup ? "G" : name[0]}
                  </div>
                )}
                {/* Online Indicator Placeholder */}
                {!isGroup && <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />}
              </div>

              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="mb-1 flex items-baseline justify-between">
                  <h4 className="truncate font-semibold text-gray-900">
                    {name}
                  </h4>
                  {lastMsg && (
                    <span className="ml-2 text-[10px] whitespace-nowrap text-gray-400">
                      {formatDistanceToNow(new Date(lastMsg.createdAt), {
                        addSuffix: false,
                      })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      "truncate text-sm",
                      selectedId === convo.id
                        ? "font-medium text-pink-700"
                        : "text-gray-500",
                      hasUnread && !selectedId && "font-bold text-gray-800",
                    )}
                  >
                    {lastMsg?.text ?? "No messages yet"}
                  </p>
                  {hasUnread && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
                      {convo.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
