"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  MoreVertical,
  Info,
  KanbanSquare,
} from "lucide-react";
import { api } from "@/trpc/react";
import { useAuth } from "@/hooks/useAuth";
import {
  useChatRealtime,
  type MessageWithStatus,
} from "@/hooks/useChatRealtime";
import { ConversationList } from "@/app/_components/chat/ConversationList";
import {
  TextMessageBubble,
  QuoteMessageBubble,
} from "@/app/_components/chat/MessageBubbles";
import {
  EventInvitationMessageBubble,
  type MessageWithInvitation,
} from "@/app/_components/chat/EventInvitationMessageBubble";
import { ChatInput } from "@/app/_components/chat/ChatInput";
import { UserInfoSidebar } from "@/app/_components/chat/UserInfoSidebar";
import {
  ConversationListSkeleton,
  ChatMessagesSkeleton,
} from "@/app/_components/chat/ChatSkeletons";
import { useUiStore } from "@/stores/ui";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createId } from "@paralleldrive/cuid2";
import { ChatSettingsModal } from "@/app/_components/chat/ChatSettingsModal";
import { normalizeDate } from "@/lib/dateUtils";

type routerOutput = inferRouterOutputs<AppRouter>;
type conversationOutput = routerOutput["chat"]["getConversations"][number];

const InboxPageContent = () => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = api.useUtils();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversation");
  const { headerHeight } = useUiStore();

  // UI State
  const [selectedConvo, setSelectedConvo] = useState<conversationOutput>();
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Ref to track if we have already auto-selected from URL
  const hasAutoSelectedRef = useRef(false);

  const { mutate: markConversationAsRead } =
    api.chat.markConversationAsRead.useMutation({
      onMutate: async ({ conversationId }) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await utils.chat.getConversations.cancel();
        await utils.chat.getUnreadConversationCount.cancel();

        // Snapshot the previous value
        const previousConversations = utils.chat.getConversations.getData();
        const previousUnreadCount =
          utils.chat.getUnreadConversationCount.getData();

        // Optimistically update to the new value
        utils.chat.getConversations.setData(undefined, (old) => {
          if (!old) return old;
          return old.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c,
          );
        });
        utils.chat.getUnreadConversationCount.setData(undefined, (old) =>
          (old ?? 0) > 0 ? old! - 1 : 0,
        );

        // Return a context object with the snapshotted value
        return { previousConversations, previousUnreadCount };
      },
      onError: (err, newTodo, context) => {
        utils.chat.getConversations.setData(
          undefined,
          context?.previousConversations,
        );
        utils.chat.getUnreadConversationCount.setData(
          undefined,
          context?.previousUnreadCount,
        );
      },
      onSettled: () => {
        void utils.chat.getConversations.invalidate();
        void utils.chat.getUnreadConversationCount.invalidate();
      },
    });

  // 1. Fetch Conversations
  const {
    data: conversations = [],
    isLoading: isConvosLoading,
    refetch: refetchConvos,
  } = api.chat.getConversations.useQuery(undefined, { refetchInterval: false });

  // 2. Fetch Messages (Initial Load)
  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    refetch: refetchMessages,
  } = api.chat.getMessages.useQuery(
    { conversationId: selectedConvo?.id ?? "", limit: 50 },
    { enabled: !!selectedConvo?.id },
  );

  // FIX: Use setTimeout to move the state update out of the synchronous render phase.
  // This satisfies the linter warning about cascading renders.
  useEffect(() => {
    // If no URL param, or no data yet, skip.
    if (!conversationIdFromUrl || conversations.length === 0) {
      return;
    }

    // If we already auto-selected, skip.
    if (hasAutoSelectedRef.current) {
      return;
    }

    const convoToSelect = conversations.find(
      (c) => c.id === conversationIdFromUrl,
    );

    if (convoToSelect) {
      // Avoid re-setting if it's the same to be safe
      if (selectedConvo?.id !== convoToSelect.id) {
        // Push to next tick to avoid "Synchronous setState" warning
        setTimeout(() => {
          setSelectedConvo(convoToSelect);
          setShowMobileChat(true);
          hasAutoSelectedRef.current = true;
        }, 0);
      }
    }
    // We intentionally exclude selectedConvo from deps to avoid loops,
    // relying on the ref to ensure this runs once per data load/URL change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationIdFromUrl, conversations]);

  // When selectedConvo changes, mark messages as read.
  useEffect(() => {
    if (selectedConvo?.id) {
      markConversationAsRead({ conversationId: selectedConvo.id });
    }
  }, [selectedConvo?.id, markConversationAsRead]);

  // 3. HOOK: Handle Realtime Updates
  const {
    messages,
    addOptimisticMessage,
    removeOptimisticMessage,
    updateOptimisticStatus,
    sendTypingEvent,
    typingUsers,
  } = useChatRealtime(selectedConvo?.id, messagesData?.messages ?? []);

  // 4. Mutation: Send Message
  const sendMessage = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      void refetchConvos();
    },
  });

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]); // Scroll when typing changes too

  const handleSend = async (text: string, retryTempId?: string) => {
    if (!selectedConvo || !user) return;

    const tempId = retryTempId ?? createId();

    const optimisticMsg: MessageWithStatus = {
      id: tempId,
      tempId: tempId,
      text: text,
      senderId: user.id,
      conversationId: selectedConvo.id,
      createdAt: new Date(),
      status: "sending",
      quote: null,
      eventInvitation: null,
      sender: {
        id: user.id,
        username: user.username,
        clientProfile: null,
        vendorProfile: null,
      },
      isDeletedForEveryone: false,
      deletedByIds: [],
    };

    if (retryTempId) {
      updateOptimisticStatus(retryTempId, "sending");
    } else {
      addOptimisticMessage(optimisticMsg);
    }

    sendMessage.mutate(
      { conversationId: selectedConvo.id, text },
      {
        onSuccess: () => {
          removeOptimisticMessage(tempId);
        },
        onError: (error) => {
          console.error("Failed to send:", error);
          updateOptimisticStatus(tempId, "error");
        },
      },
    );
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return null;
    const names = typingUsers.map(userId => {
        const p = selectedConvo?.participants.find(p => p.userId === userId);
        return p?.user.username ?? "Someone";
    });
    
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return "Several people are typing...";
  };

  if (!user)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-pink-600" />
      </div>
    );

  const isVendor = !!user.vendorProfile;

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900"
      style={{ paddingTop: headerHeight }}
    >
      <ChatSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <div
        className="flex border-t border-gray-200 bg-white text-gray-900"
        style={{ height: `calc(100vh - ${headerHeight}px)` }}
      >
        {/* Left Sidebar: Conversation List */}
        <aside
          className={`w-full border-r sm:w-1/3 lg:w-1/4 ${showMobileChat ? "hidden sm:flex" : "flex"}`}
        >
          {isConvosLoading ? (
            <ConversationListSkeleton />
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedConvo?.id}
              onSelect={(c) => {
                setSelectedConvo(c);
                setShowMobileChat(true);
              }}
              currentUserId={user.id}
              onOpenSettings={() => setShowSettings(true)}
            />
          )}
        </aside>

        {/* Middle: Chat Area */}
        <main
          className={`flex flex-1 flex-col bg-[#efeae2] ${!showMobileChat ? "hidden sm:flex" : "flex"}`}
        >
          {selectedConvo ? (
            <>
              {/* Header */}
              <div className="z-10 flex items-center justify-between border-b bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="sm:hidden"
                  >
                    <ArrowLeft />
                  </button>
                  <h3 className="font-bold text-gray-800">
                    {selectedConvo.isGroup
                      ? (selectedConvo.clientEvent?.title ?? "Group Chat")
                      : selectedConvo.participants.find(
                          (p) => p.user.id !== user.id,
                        )?.user.username}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConvo.clientEventId && (
                    <Link href={`/event/${selectedConvo.clientEventId}/board`}>
                      <Button variant="ghost" size="icon">
                        <KanbanSquare className="h-5 w-5 text-gray-500" />
                      </Button>
                    </Link>
                  )}
                  <button
                    onClick={() => setShowInfoSidebar(true)}
                    className="lg:hidden"
                  >
                    <Info className="text-gray-400" />
                  </button>
                  <div className="hidden lg:block">
                    <MoreVertical className="text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Messages Window */}
              {isMessagesLoading ? (
                <ChatMessagesSkeleton />
              ) : (
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {(() => {
                    let shownUnreadDivider = false;
                    return messages.map((msg) => {
                      const isUnread =
                        messagesData?.firstUnreadTimestamp &&
                        new Date(msg.createdAt) >=
                          new Date(messagesData.firstUnreadTimestamp) &&
                        msg.senderId !== user.id;

                      let showDivider = false;
                      if (isUnread && !shownUnreadDivider) {
                        showDivider = true;
                        shownUnreadDivider = true;
                      }

                      // Check read status
                      let isRead = false;
                      if (msg.senderId === user.id && selectedConvo) {
                          const otherParticipants = selectedConvo.participants.filter(p => p.userId !== user.id);
                          // Check if everyone else has read it
                          const messageDate = normalizeDate(msg.createdAt);
                          isRead = otherParticipants.length > 0 && otherParticipants.every(p => {
                              return p.lastReadAt && new Date(p.lastReadAt) >= messageDate;
                          });
                      }

                      return (
                        <React.Fragment key={msg.id || msg.tempId}>
                          {showDivider && (
                            <div className="relative my-4 text-center">
                              <hr className="border-gray-300" />
                              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#efeae2] px-2 text-xs font-bold text-gray-500 uppercase">
                                New Messages
                              </span>
                            </div>
                          )}
                          {msg.eventInvitation ? (
                            <EventInvitationMessageBubble
                              message={msg as MessageWithInvitation}
                              isMe={msg.senderId === user.id}
                              onUpdate={() => refetchMessages()}
                            />
                          ) : msg.quote ? (
                            <QuoteMessageBubble
                              message={msg}
                              isMe={msg.senderId === user.id}
                              _onUpdate={() => refetchMessages()}
                            />
                          ) : (
                            <TextMessageBubble
                              message={msg}
                              isMe={msg.senderId === user.id}
                              onRetry={() => handleSend(msg.text, msg.tempId)}
                              // Pass refetch to TextMessageBubble for actions
                              onUpdate={() => refetchMessages()}
                              isGroupAdmin={selectedConvo.groupAdminId === user.id}
                              isRead={isRead}
                            />
                          )}
                        </React.Fragment>
                      );
                    });
                  })()}
                  <div ref={scrollRef} />
                </div>
              )}

              {/* Input */}
              <div className="bg-white p-4">
                {typingUsers.length > 0 && (
                    <div className="text-xs text-gray-500 italic mb-2 ml-2 animate-pulse">
                        {getTypingText()}
                    </div>
                )}
                <ChatInput
                  onSend={handleSend}
                  isVendor={isVendor}
                  conversationId={selectedConvo.id}
                  otherUserId={
                    selectedConvo.participants.find(
                      (p) => p.user.id !== user.id,
                    )?.user.id ?? ""
                  }
                  disabled={sendMessage.isPending}
                  onQuoteSent={() => {
                    void refetchMessages();
                    void refetchConvos();
                  }}
                  isGroup={selectedConvo.isGroup}
                  onTyping={sendTypingEvent}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-gray-50 text-gray-400">
              Select a conversation to start chatting
            </div>
          )}
        </main>

        {/* Right: Info Sidebar (Only on large screens) */}
        <aside className="hidden w-1/4 overflow-y-auto border-l bg-white lg:block">
          {selectedConvo && (
            <UserInfoSidebar
              conversation={selectedConvo}
              currentUserId={user.id}
            />
          )}
        </aside>

        {/* Mobile Info Sidebar */}
        {showInfoSidebar && selectedConvo && (
          <div
            className="absolute inset-0 z-20 bg-black/30 lg:hidden"
            onClick={() => setShowInfoSidebar(false)}
            style={{ top: headerHeight }}
          >
            <div
              className="absolute top-0 right-0 h-full w-4/5 max-w-sm bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <UserInfoSidebar
                conversation={selectedConvo}
                currentUserId={user.id}
                onClose={() => setShowInfoSidebar(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InboxPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="animate-spin text-pink-600" />
        </div>
      }
    >
      <InboxPageContent />
    </Suspense>
  );
};

export default InboxPage;