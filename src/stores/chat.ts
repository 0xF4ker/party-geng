import { create } from "zustand";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Message = RouterOutput["chat"]["getMessages"]["messages"][number];
export type OptimisticMessage = Message & {
  status: "pending" | "sent" | "failed";
};

type Conversation = RouterOutput["chat"]["getConversations"][number];

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, OptimisticMessage[]>;
  selectedConversation: Conversation | null;
  setConversations: (conversations: Conversation[]) => void;
  addMessage: (conversationId: string, message: OptimisticMessage) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  updateMessageStatus: (
    conversationId: string,
    messageId: string,
    newStatus: "sent" | "failed",
    newMessage?: Message,
  ) => void;
  setSelectedConversation: (conversation: Conversation | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: {},
  selectedConversation: null,
  setConversations: (conversations) => set({ conversations }),
  addMessage: (conversationId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] ?? []), message],
      },
    }));
  },
  removeMessage: (conversationId, messageId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] ?? []).filter(
          (m) => m.id !== messageId,
        ),
      },
    }));
  },
  updateMessageStatus: (conversationId, messageId, newStatus, newMessage) => {
    set((state) => {
      const conversationMessages = state.messages[conversationId] ?? [];
      const messageIndex = conversationMessages.findIndex(
        (m) => m.id === messageId,
      );

      if (messageIndex === -1) {
        return state;
      }

      const newMessages = [...conversationMessages];
      const oldMessage = newMessages[messageIndex]!;

      if (newMessage) {
        // Replace optimistic message with real message from server
        newMessages[messageIndex] = {
          ...newMessage,
          status: newStatus,
        };
      } else {
        // Just update status
        newMessages[messageIndex] = {
          ...oldMessage,
          status: newStatus,
        };
      }

      return {
        messages: {
          ...state.messages,
          [conversationId]: newMessages,
        },
      };
    });
  },
  setSelectedConversation: (conversation) =>
    set({ selectedConversation: conversation }),
  setMessages: (conversationId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages.map((m) => ({ ...m, status: "sent" })),
      },
    }));
  },
}));