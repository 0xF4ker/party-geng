"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, Send, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useChatRealtime } from "@/hooks/useChatRealtime";
import { TextMessageBubble } from "../chat/MessageBubbles";
import { toast } from "sonner";

interface EventChatModalProps {
  conversationId: string;
  onClose: () => void;
}

export const EventChatModal = ({
  conversationId,
  onClose,
}: EventChatModalProps) => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = api.useUtils();

  // Fetch initial messages
  const { data: messagesData, isLoading } = api.chat.getMessages.useQuery({
    conversationId,
    limit: 50,
  });

  // Realtime updates
  const {
    messages,
    addOptimisticMessage,
    removeOptimisticMessage,
    updateOptimisticStatus,
  } = useChatRealtime(conversationId, messagesData?.messages ?? []);

  // Send message mutation
  const sendMessage = api.chat.sendMessage.useMutation({
    onMutate: async (newMessage) => {
      if (!newMessage.optimisticId) {
        return;
      }
      await utils.chat.getMessages.cancel({ conversationId });
      const previousMessages = utils.chat.getMessages.getData({
        conversationId,
      });

      const optimisticMessage = {
        id: newMessage.optimisticId,
        tempId: newMessage.optimisticId,
        text: newMessage.text,
        senderId: user!.id,
        conversationId,
        createdAt: new Date(), // Changed to Date object
        status: "sending" as const,
        quote: null,
        eventInvitation: null,
        sender: {
          id: user!.id,
          username: user!.username,
          clientProfile: null,
          vendorProfile: null,
        },
      };

      addOptimisticMessage(optimisticMessage);

      return { previousMessages, optimisticId: newMessage.optimisticId };
    },
    onSuccess: (sentMessage, _variables, context) => {
      if (sentMessage && context?.optimisticId) {
        removeOptimisticMessage(context.optimisticId);
        const finalMessage = {
          ...sentMessage,
          status: "sent" as const,
          tempId: sentMessage.id, // Keep the server-generated ID as tempId
        };
        addOptimisticMessage(finalMessage);
      }
    },
    onError: (error, variables, context) => {
      if (context?.optimisticId) {
        updateOptimisticStatus(context.optimisticId, "error");
      }
      toast.error("Failed to send message. Please try again.");
    },
    onSettled: () => {
      void utils.chat.getMessages.invalidate({ conversationId });
    },
  });

  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim() || !user) return;
    const optimisticId = `temp-${Date.now()}`;
    sendMessage.mutate({ conversationId, text, optimisticId });
    setText("");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[500px] sm:w-96 sm:rounded-lg sm:border sm:shadow-2xl"
    >
      <div className="flex items-center justify-between rounded-t-lg border-b bg-gray-50 p-3">
        <h3 className="font-bold text-gray-800">Event Chat</h3>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-gray-500 hover:bg-gray-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-pink-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <TextMessageBubble
                key={msg.id}
                message={msg}
                isMe={msg.senderId === user?.id}
                onRetry={() => {
                  if (msg.tempId) handleSend();
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t p-2">
        <div className="relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="w-full rounded-lg border-gray-200 bg-gray-100 p-2 pr-12 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={sendMessage.isPending || !text.trim()}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-pink-600 p-2 text-white disabled:bg-gray-300"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
