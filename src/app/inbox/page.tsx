"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, MoreVertical, Info } from "lucide-react";
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
import { ChatInput } from "@/app/_components/chat/ChatInput";
import { UserInfoSidebar } from "@/app/_components/chat/UserInfoSidebar";
import {
  ConversationListSkeleton,
  ChatMessagesSkeleton,
} from "@/app/_components/chat/ChatSkeletons";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { useUiStore } from "@/stores/ui";

type routerOutput = inferRouterOutputs<AppRouter>;
type conversationOutput = routerOutput["chat"]["getConversations"][number];

const InboxPage = () => {
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

  const { mutate: markConversationAsRead } =
    api.notification.markConversationAsRead.useMutation({
      onSuccess: () => {
        void utils.chat.getConversations.invalidate();
        void utils.notification.getUnreadCount.invalidate();
      },
    });

  // 1. Fetch Conversations
  const {
    data: conversations = [],
    isLoading: isConvosLoading,
    refetch: refetchConvos,
  } = api.chat.getConversations.useQuery(undefined, { refetchInterval: false }); // Disable interval refetch if using Realtime for convos

  // 2. Fetch Messages (Initial Load)
  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    refetch: refetchMessages,
  } = api.chat.getMessages.useQuery(
    { conversationId: selectedConvo?.id ?? "", limit: 50 },
    { enabled: !!selectedConvo?.id },
  );

  // Auto-select conversation from URL
  useEffect(() => {
    if (conversationIdFromUrl && conversations.length > 0 && !selectedConvo) {
      const convoToSelect = conversations.find(
        (c) => c.id === conversationIdFromUrl,
      );
      if (convoToSelect) {
        setSelectedConvo(convoToSelect);
        setShowMobileChat(true); // For mobile view
      }
    }
  }, [conversationIdFromUrl, conversations, selectedConvo]);

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
  } = useChatRealtime(selectedConvo?.id, messagesData?.messages ?? []);

  // 4. Mutation: Send Message
  const sendMessage = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      // In a perfect realtime setup, we don't even need to refetch here,
      // Supabase will echo the message back via the channel.
      // But keeping it for safety:
      void refetchConvos();
    },
  });

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (text: string, retryTempId?: string) => {
    if (!selectedConvo || !user) return;

    // A. Generate a temporary ID (use retry ID if available)
    const tempId = retryTempId ?? `temp-${Date.now()}`;

    // B. Create the Optimistic Message Object
    const optimisticMsg: MessageWithStatus = {
      id: tempId,
      tempId: tempId,
      text: text,
      senderId: user.id,
      conversationId: selectedConvo.id,
      createdAt: new Date(), // Date object is fine now
      status: "sending",
      quote: null,

      // FIX: Provide the full sender structure (even if nulls)
      sender: {
        id: user.id,
        username: user.username,
        clientProfile: null, // Explicitly null
        vendorProfile: null, // Explicitly null
      },
    };

    // C. Add to UI immediately
    // If it's a retry, we don't add it again, we just update status to sending
    if (retryTempId) {
      updateOptimisticStatus(retryTempId, "sending");
    } else {
      addOptimisticMessage(optimisticMsg);
    }

    // D. Perform Mutation
    sendMessage.mutate(
      { conversationId: selectedConvo.id, text },
      {
        onSuccess: () => {
          // Success! The Realtime socket will likely deliver the message milliseconds later.
          // We remove the optimistic one so we don't have duplicates when the real one arrives.
          removeOptimisticMessage(tempId);

          // Optional: If you want to be 100% sure the list is fresh, you can leave this
          // but Realtime usually handles it.
          // void refetchConvos();
        },
        onError: (error) => {
          console.error("Failed to send:", error);
          // Mark as error in UI so user can retry
          updateOptimisticStatus(tempId, "error");
        },
      },
    );
  };

  if (!user)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-pink-600" />
      </div>
    );

  const isVendor = !!user.vendorProfile;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" style={{ paddingTop: headerHeight }}>
      <div className="flex border-t border-gray-200 bg-white text-gray-900" style={{ height: `calc(100vh - ${headerHeight}px)`}}>
        {/* Left Sidebar: Conversation List */}
        <aside
          className={`w-full border-r sm:w-1/3 lg:w-1/4 ${showMobileChat ? "hidden sm:flex" : "flex"}`}
        >
          {isConvosLoading ? (
            // A. Show Skeleton while fetching list
            <ConversationListSkeleton />
          ) : (
            // B. Show List
            <ConversationList
              conversations={conversations}
              selectedId={selectedConvo?.id}
              onSelect={(c) => {
                setSelectedConvo(c);
                setShowMobileChat(true);
              }}
              currentUserId={user.id}
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
                    {/* Logic to get name */}
                    {
                      selectedConvo.participants.find((p) => p.id !== user.id)
                        ?.username
                    }
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowInfoSidebar(true)} className="lg:hidden">
                        <Info className="text-gray-400" />
                    </button>
                    <div className="hidden lg:block">
                        <MoreVertical className="text-gray-400" />
                    </div>
                </div>
              </div>

              {/* Messages Window */}
              {isMessagesLoading ? (
                // C. Show Skeleton while fetching specific messages
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
                          {/* Check if it's a quote or text */}
                          {msg.quote ? (
                            <QuoteMessageBubble
                              message={msg}
                              isMe={msg.senderId === user.id}
                              onUpdate={() => refetchMessages()}
                            />
                          ) : (
                            <TextMessageBubble
                              message={msg}
                              isMe={msg.senderId === user.id}
                              // Pass the retry function
                              onRetry={() => handleSend(msg.text, msg.tempId)}
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
                <ChatInput
                  onSend={handleSend}
                  isVendor={isVendor}
                  conversationId={selectedConvo.id}
                  otherUserId={
                    selectedConvo.participants.find((p) => p.id !== user.id)
                      ?.id ?? ""
                  }
                  disabled={sendMessage.isPending}
                  onQuoteSent={() => {
                    void refetchMessages();
                    void refetchConvos();
                  }}
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
            <div className="absolute inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setShowInfoSidebar(false)} style={{top: headerHeight}}>
                <div className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white" onClick={(e) => e.stopPropagation()}>
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

export default InboxPage;
