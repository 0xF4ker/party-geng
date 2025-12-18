// components/chat/ConversationList.tsx
import React, { useState, useMemo } from "react";
import { Search, Users } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"messages" | "groups">("messages");

  const unreadCounts = useMemo(() => {
    return conversations.reduce(
      (acc, c) => {
        if (c.unreadCount > 0) {
          if (c.isGroup) {
            acc.groups += c.unreadCount;
          } else {
            acc.messages += c.unreadCount;
          }
        }
        return acc;
      },
      { messages: 0, groups: 0 },
    );
  }, [conversations]);

  const filtered = useMemo(() => {
    return conversations
      .filter((c) => {
        if (activeTab === "groups") return c.isGroup;
        return !c.isGroup;
      })
      .filter((c) => {
        if (c.isGroup) {
          return c.clientEvent?.title
            .toLowerCase()
            .includes(search.toLowerCase());
        }
        const otherParticipant = c.participants.find(
          (p) => p.userId !== currentUserId,
        );
        const otherUser = otherParticipant?.user;
        const name =
          otherUser?.vendorProfile?.companyName ??
          otherUser?.clientProfile?.name ??
          otherUser?.username ??
          "";
        return name.toLowerCase().includes(search.toLowerCase());
      });
  }, [conversations, search, currentUserId, activeTab]);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="border-b border-gray-100 p-4 pb-0">
        <h2 className="mb-4 text-xl font-bold">Inbox</h2>

        {/* Tabs */}
        <div className="flex w-full border-b border-gray-100">
          <button
            onClick={() => setActiveTab("messages")}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors",
              activeTab === "messages"
                ? "border-pink-600 text-pink-600"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            Messages
            {unreadCounts.messages > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-pink-600 px-1 text-[10px] text-white">
                {unreadCounts.messages}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors",
              activeTab === "groups"
                ? "border-pink-600 text-pink-600"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            Groups
            {unreadCounts.groups > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-pink-600 px-1 text-[10px] text-white">
                {unreadCounts.groups}
              </span>
            )}
          </button>
        </div>

        <div className="relative mt-4 mb-4">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-xl border border-transparent bg-gray-50 py-2 pl-10 text-sm transition-all outline-none focus:border-pink-200 focus:bg-white"
            placeholder={
              activeTab === "groups" ? "Search groups..." : "Search messages..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-center text-gray-500">
            <p>No {activeTab} found</p>
          </div>
        ) : (
          filtered.map((convo) => {
            const isGroup = convo.isGroup;
            let name: string;
            let avatar: string | null | undefined;

            if (isGroup) {
              name = convo.clientEvent?.title ?? "Event Group Chat";
              avatar = null; // Or a default group icon
            } else {
              const other = convo.participants.find(
                (p) => p.userId !== currentUserId,
              )?.user;
              name =
                other?.vendorProfile?.companyName ??
                other?.clientProfile?.name ??
                other?.username ??
                "User";
              avatar =
                other?.vendorProfile?.avatarUrl ??
                other?.clientProfile?.avatarUrl;
            }

            const lastMsg = convo.messages[0];
            const hasUnread = convo.unreadCount > 0;

            return (
              <button
                key={convo.id}
                onClick={() => onSelect(convo)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-gray-50 p-4 text-left transition-colors hover:bg-gray-50",
                  selectedId === convo.id &&
                    "border-r-4 border-b-transparent border-r-pink-600 bg-pink-50/60",
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
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full font-bold",
                        isGroup
                          ? "bg-purple-100 text-purple-700"
                          : "bg-pink-100 text-pink-700",
                      )}
                    >
                      {isGroup ? <Users className="h-5 w-5" /> : name[0]}
                    </div>
                  )}
                  {/* Online Indicator Placeholder */}
                  {!isGroup && (
                    <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="mb-1 flex items-baseline justify-between">
                    <h4 className="truncate font-semibold text-gray-900">
                      {name}
                    </h4>
                    {lastMsg && (
                      <span className="ml-2 whitespace-nowrap text-[10px] text-gray-400">
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
          })
        )}
      </div>
    </div>
  );
};

