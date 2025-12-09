import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { normalizeDate } from "@/lib/dateUtils";

type routerOutput = inferRouterOutputs<AppRouter>;
type DBMessage = routerOutput["chat"]["getMessages"]["messages"][number];

export interface OptimisticMessage {
  id: string;
  tempId: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  status: "sending" | "sent" | "error";
  quote: null;
  eventInvitation: null;
  sender: {
    username: string;
  };
}

export type MessageWithStatus = DBMessage & {
  tempId?: string;
  status?: "sending" | "sent" | "error";
};

export const useChatRealtime = (
  conversationId: string | undefined,
  initialMessages: DBMessage[],
) => {
  const [newMessages, setNewMessages] = useState<MessageWithStatus[]>([]);

  useEffect(() => {
    // This pushes the state reset to the next tick.
    const timer = setTimeout(() => {
      setNewMessages([]);
    }, 0);

    return () => clearTimeout(timer);
  }, [conversationId]);

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
          const newMessage: MessageWithStatus = {
            ...rawMessage,
            createdAt: normalizeDate(rawMessage.createdAt),
            status: "sent",
            sender: rawMessage.sender || { username: "..." },
            quote: rawMessage.quote ?? null,
            eventInvitation: rawMessage.eventInvitation ?? null,
          };
          setNewMessages((prev) => [...prev, newMessage]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const addOptimisticMessage = useCallback((msg: MessageWithStatus) => {
    setNewMessages((prev) => [...prev, msg]);
  }, []);

  const updateOptimisticStatus = useCallback(
    (tempId: string, status: "sending" | "error" | "sent") => {
      setNewMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, status } : m)),
      );
    },
    [],
  );

  const removeOptimisticMessage = useCallback((tempId: string) => {
    setNewMessages((prev) => prev.filter((m) => m.tempId !== tempId));
  }, []);

  const setMessages = (setter: React.SetStateAction<MessageWithStatus[]>) => {
    if (typeof setter === "function") {
      setNewMessages(setter);
    }
  };

  const messages = useMemo(() => {
    const messageMap = new Map<string, MessageWithStatus>();

    initialMessages.forEach((msg) => messageMap.set(msg.id, msg));
    newMessages.forEach((msg) => messageMap.set(msg.id, msg));

    return Array.from(messageMap.values()).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [initialMessages, newMessages]);

  return {
    messages,
    addOptimisticMessage,
    updateOptimisticStatus,
    removeOptimisticMessage,
    setMessages,
  };
};
