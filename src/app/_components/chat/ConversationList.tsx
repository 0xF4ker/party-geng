// components/chat/ConversationList.tsx
import React, { useState, useMemo } from "react";
import { Search, Users, Settings, MoreVertical, Pin, Archive, BellOff, Trash2, LogOut } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/trpc/react";
import { toast } from "sonner";

type routerOutput = inferRouterOutputs<AppRouter>;
type conversationOutput = routerOutput["chat"]["getConversations"][number];

export const ConversationList = ({
  conversations,
  selectedId,
  onSelect,
  currentUserId,
  onOpenSettings,
}: {
  conversations: conversationOutput[];
  selectedId?: string;
  onSelect: (c: conversationOutput) => void;
  currentUserId: string;
  onOpenSettings: () => void;
}) => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"messages" | "groups">("messages");
  const utils = api.useUtils();

  const updateSettingsMutation = api.chat.updateConversationSettings.useMutation({
    onMutate: async (newSettings) => {
      await utils.chat.getConversations.cancel();
      const previousConversations = utils.chat.getConversations.getData();

      utils.chat.getConversations.setData(undefined, (old) => {
        if (!old) return [];
        return old.map((convo) => {
          if (convo.id === newSettings.conversationId) {
            return {
              ...convo,
              isPinned: newSettings.isPinned ?? convo.isPinned,
              isArchived: newSettings.isArchived ?? convo.isArchived,
              isMuted: newSettings.isMuted ?? convo.isMuted,
            };
          }
          return convo;
        });
      });

      return { previousConversations };
    },
    onError: (err, newSettings, context) => {
      toast.error(err.message);
      if (context?.previousConversations) {
        utils.chat.getConversations.setData(undefined, context.previousConversations);
      }
    },
    onSettled: () => utils.chat.getConversations.invalidate(),
  });

  const deleteConversationMutation = api.chat.deleteConversation.useMutation({
    onMutate: async ({ conversationId }) => {
      await utils.chat.getConversations.cancel();
      const previousConversations = utils.chat.getConversations.getData();

      // Optimistically remove the conversation from the list
      utils.chat.getConversations.setData(undefined, (old) => {
        if (!old) return [];
        return old.filter((c) => c.id !== conversationId);
      });

      return { previousConversations };
    },
    onSuccess: () => {
      toast.success("Conversation cleared");
    },
    onError: (err, variables, context) => {
      toast.error(err.message);
      if (context?.previousConversations) {
        utils.chat.getConversations.setData(undefined, context.previousConversations);
      }
    },
    onSettled: () => utils.chat.getConversations.invalidate(),
  });

  const leaveGroupMutation = api.chat.leaveGroup.useMutation({
    onMutate: async ({ conversationId }) => {
      await utils.chat.getConversations.cancel();
      const previousConversations = utils.chat.getConversations.getData();

      // Optimistically remove the conversation from the list
      utils.chat.getConversations.setData(undefined, (old) => {
        if (!old) return [];
        return old.filter((c) => c.id !== conversationId);
      });

      return { previousConversations };
    },
    onSuccess: () => {
      toast.success("Left group");
    },
    onError: (err, variables, context) => {
      toast.error(err.message);
      if (context?.previousConversations) {
        utils.chat.getConversations.setData(undefined, context.previousConversations);
      }
    },
    onSettled: () => utils.chat.getConversations.invalidate(),
  });

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

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
      })
      .sort((a, b) => {
        // Sort by pinned first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Then by date
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [conversations, search, currentUserId, activeTab]);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="border-b border-gray-100 p-4 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Inbox</h2>
          <button
            onClick={onOpenSettings}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

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
              <div
                key={convo.id}
                onClick={() => onSelect(convo)}
                className={cn(
                  "group relative flex w-full cursor-pointer items-start gap-3 border-b border-gray-50 p-4 text-left transition-colors hover:bg-gray-50",
                  selectedId === convo.id &&
                    "border-r-4 border-b-transparent border-r-pink-600 bg-pink-50/60",
                  convo.isPinned && "bg-gray-50/50"
                )}
              >
                {convo.isPinned && (
                  <Pin className="absolute top-2 right-2 h-3 w-3 text-gray-400 rotate-45" />
                )}
                
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
                  <div className="mb-1 flex items-baseline justify-between pr-6">
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
                        "truncate text-sm pr-6",
                        selectedId === convo.id
                          ? "font-medium text-pink-700"
                          : "text-gray-500",
                        hasUnread && !selectedId && "font-bold text-gray-800",
                      )}
                    >
                      {convo.isMuted && <BellOff className="inline mr-1 h-3 w-3" />}
                      {lastMsg?.isDeletedForEveryone ? (
                        <span className="italic">Message deleted</span>
                      ) : (
                        lastMsg?.text ?? "No messages yet"
                      )}
                    </p>
                    {hasUnread && (
                      <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Context Menu Trigger */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-full hover:bg-gray-200">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleAction(e, () => updateSettingsMutation.mutate({ conversationId: convo.id, isPinned: !convo.isPinned }))}>
                        <Pin className="mr-2 h-4 w-4" /> {convo.isPinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleAction(e, () => updateSettingsMutation.mutate({ conversationId: convo.id, isArchived: !convo.isArchived }))}>
                        <Archive className="mr-2 h-4 w-4" /> {convo.isArchived ? "Unarchive" : "Archive"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleAction(e, () => updateSettingsMutation.mutate({ conversationId: convo.id, isMuted: !convo.isMuted }))}>
                        <BellOff className="mr-2 h-4 w-4" /> {convo.isMuted ? "Unmute" : "Mute"}
                      </DropdownMenuItem>
                      {convo.isGroup ? (
                        <DropdownMenuItem onClick={(e) => handleAction(e, () => leaveGroupMutation.mutate({ conversationId: convo.id }))} className="text-red-600">
                          <LogOut className="mr-2 h-4 w-4" /> Leave Group
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={(e) => handleAction(e, () => deleteConversationMutation.mutate({ conversationId: convo.id }))} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Conversation
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

