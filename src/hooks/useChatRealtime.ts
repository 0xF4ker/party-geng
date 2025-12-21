import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { normalizeDate } from "@/lib/dateUtils";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/trpc/react";

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
    id: string;
    username: string;
    clientProfile: null;
    vendorProfile: null;
  };
  isDeletedForEveryone: boolean;
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
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { profile } = useAuthStore();
  const { data: settings } = api.chat.getSettings.useQuery();

  useEffect(() => {
    // This pushes the state reset to the next tick.
    const timer = setTimeout(() => {
      setNewMessages([]);
      setTypingUsers(new Set());
      typingTimeouts.current.forEach(clearTimeout);
      typingTimeouts.current.clear();
    }, 0);

    return () => clearTimeout(timer);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`room:${conversationId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
          const rawMessage = payload.new as any; // Cast to any to access new fields safely
          const newMessage: MessageWithStatus = {
            ...rawMessage,
            createdAt: normalizeDate(rawMessage.createdAt),
            status: "sent",
            sender: rawMessage.sender || { 
                id: rawMessage.senderId, 
                username: "...",
                clientProfile: null,
                vendorProfile: null
            },
            quote: rawMessage.quote ?? null,
            eventInvitation: rawMessage.eventInvitation ?? null,
            isDeletedForEveryone: rawMessage.isDeletedForEveryone ?? false,
          };
          setNewMessages((prev) => [...prev, newMessage]);
          
          // Clear typing indicator for this user when they send a message
          if (rawMessage.senderId) {
             setTypingUsers((prev) => {
                const next = new Set(prev);
                next.delete(rawMessage.senderId);
                return next;
             });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Message",
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
           // Handle updates like "Delete for Everyone"
           const updatedMessage = payload.new as any;
           
           const newMessage: MessageWithStatus = {
            ...updatedMessage,
            createdAt: normalizeDate(updatedMessage.createdAt),
            status: "sent",
            sender: updatedMessage.sender || { 
                id: updatedMessage.senderId, 
                username: "...",
                clientProfile: null,
                vendorProfile: null
            },
            quote: updatedMessage.quote ?? null,
            eventInvitation: updatedMessage.eventInvitation ?? null,
            isDeletedForEveryone: updatedMessage.isDeletedForEveryone ?? false,
          };
           setNewMessages((prev) => {
               const filtered = prev.filter(m => m.id !== updatedMessage.id);
               // If existing message updated, we update it in place. 
               // However, `messages` memo handles merging by ID.
               // We just push the updated version.
               return [...filtered, newMessage];
           });
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
          const userId = payload.payload.userId;
          if (!userId) return;

          setTypingUsers((prev) => {
              const next = new Set(prev);
              next.add(userId);
              return next;
          });

          // Clear existing timeout
          if (typingTimeouts.current.has(userId)) {
              clearTimeout(typingTimeouts.current.get(userId));
          }

          // Set new timeout to clear typing status
          const timeout = setTimeout(() => {
              setTypingUsers((prev) => {
                  const next = new Set(prev);
                  next.delete(userId);
                  return next;
              });
              typingTimeouts.current.delete(userId);
          }, 3000);

          typingTimeouts.current.set(userId, timeout);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId]);

  const sendTypingEvent = useCallback(() => {
      if (!channelRef.current || !profile) return;
      if (settings?.typingIndicators === false) return;
      
      void channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: profile.id },
      });
  }, [profile, settings]);

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
    sendTypingEvent,
    typingUsers: Array.from(typingUsers),
  };
};