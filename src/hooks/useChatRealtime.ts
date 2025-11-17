import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { normalizeDate } from "@/lib/dateUtils";

type routerOutput = inferRouterOutputs<AppRouter>;

// Base type from your DB
type DBMessage = routerOutput["chat"]["getMessages"]["messages"][number];

export interface OptimisticMessage {
  id: string;
  tempId: string; // Local temporary ID
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  status: "sending" | "sent" | "error";
  quote: null;
  sender: {
    username: string;
  };
}

// Extended type for UI state
export type MessageWithStatus = DBMessage & {
  tempId?: string; // To track local messages before they have a DB ID
  status?: "sending" | "sent" | "error";
};

export const useChatRealtime = (
  conversationId: string | undefined,
  initialMessages: DBMessage[],
) => {
  const [messages, setMessages] =
    useState<MessageWithStatus[]>(initialMessages);

  // Reset when switching rooms
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // 1. Handle Realtime "INSERT" from Supabase
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`room:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
          const rawMessage = payload.new as DBMessage;

          // Construct a clean message object with a corrected Date
          const newMessage: MessageWithStatus = {
            ...rawMessage,
            // Force the raw string through our normalizer immediately
            createdAt: normalizeDate(rawMessage.createdAt),
            status: "sent",
            // Ensure nested objects exist to prevent crashes if Supabase doesn't send joins
            sender: rawMessage.sender || { username: "..." },
            quote: rawMessage.quote ?? null,
          };

          setMessages((prev) => {
            // Deduplication: If we already have this ID (unlikely) or if we need to replace an optimistic one
            // Note: In a simple setup, we usually let the optimistic message stay until the mutation confirms success,
            // then we remove the optimistic one.
            if (prev.find((m) => m.id === newMessage.id)) return prev;
            return [...prev, { ...newMessage, status: "sent" }];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // 2. Helper: Add a message immediately (Optimistic)
  const addOptimisticMessage = useCallback((msg: MessageWithStatus) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // 3. Helper: Update status (e.g., sending -> error)
  const updateOptimisticStatus = useCallback(
    (tempId: string, status: "sending" | "error" | "sent") => {
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status } : m)),
      );
    },
    [],
  );

  // 4. Helper: Remove optimistic message (usually called when real message arrives or mutation succeeds)
  const removeOptimisticMessage = useCallback((tempId: string) => {
    setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
  }, []);

  return {
    messages,
    addOptimisticMessage,
    updateOptimisticStatus,
    removeOptimisticMessage,
    setMessages, // Exposed for manual overrides if needed
  };
};
