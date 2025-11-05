import { create } from 'zustand';
import { type Conversation, type Message } from '@prisma/client';

type ConversationWithDetails = Conversation & { participants: any[]; messages: Message[] };

interface ChatState {
  conversations: ConversationWithDetails[];
  setConversations: (conversations: ConversationWithDetails[]) => void;
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  addMessage: (message) =>
    set((state) => ({
      conversations: state.conversations.map((convo) => {
        if (convo.id === message.conversationId) {
          return {
            ...convo,
            messages: [...convo.messages, message],
          };
        }
        return convo;
      }),
    })),
}));
