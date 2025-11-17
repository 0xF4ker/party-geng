"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, ArrowLeft, MoreVertical } from "lucide-react";
import { api } from "@/trpc/react";
import { useAuth } from "@/hooks/useAuth";
import {
  useChatRealtime,
  type MessageWithStatus,
  type OptimisticMessage,
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
  UserInfoSkeleton,
} from "@/app/_components/chat/ChatSkeletons";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type routerOutput = inferRouterOutputs<AppRouter>;
type conversationOutput = routerOutput["chat"]["getConversations"][number];

const InboxPage = () => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  // UI State
  const [selectedConvo, setSelectedConvo] = useState<conversationOutput>();
  const [showMobileChat, setShowMobileChat] = useState(false);

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

  // 3. HOOK: Handle Realtime Updates
  const {
    messages,
    addOptimisticMessage,
    removeOptimisticMessage,
    updateOptimisticStatus,
  } = useChatRealtime(selectedConvo?.id, messagesData?.messages ?? []);

  // 4. Mutation: Send Message
  const sendMessage = api.chat.sendMessage.useMutation({
    onMutate: async (newMsg) => {
      // OPTIONAL: Optimistic Update here for instant UI feedback
    },
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
        onSuccess: (data) => {
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
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      <div className="flex h-[calc(100vh-122px)] border-t border-gray-200 bg-white text-gray-900 lg:h-[calc(100vh-127px)]">
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
                <MoreVertical className="text-gray-400" />
              </div>

              {/* Messages Window */}
              {isMessagesLoading ? (
                // C. Show Skeleton while fetching specific messages
                <ChatMessagesSkeleton />
              ) : (
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {messages.map((msg) => (
                    <React.Fragment key={msg.id || msg.tempId}>
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
                  ))}
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
      </div>
    </div>
  );
};

export default InboxPage;
