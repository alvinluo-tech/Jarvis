import { create } from "zustand";
import type { Conversation, ConversationMessage, SendMessageResponse } from "@/lib/tauri";
import * as tauri from "@/lib/tauri";

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ConversationMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  fetchConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<Conversation>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  sendMessage: (content: string) => Promise<SendMessageResponse | null>;
  clearActive: () => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  isSending: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await tauri.listConversations();
      set({ conversations, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createConversation: async (title?: string) => {
    set({ isLoading: true, error: null });
    try {
      const conversation = await tauri.createConversation(title);
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        activeConversationId: conversation.id,
        messages: [],
        isLoading: false,
      }));
      return conversation;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  selectConversation: async (id: string) => {
    set({ isLoading: true, error: null, activeConversationId: id });
    try {
      const { messages } = await tauri.getConversation(id);
      set({ messages, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await tauri.deleteConversation(id);
      set((state) => {
        const newConversations = state.conversations.filter((c) => c.id !== id);
        const newActiveId = state.activeConversationId === id ? null : state.activeConversationId;
        return {
          conversations: newConversations,
          activeConversationId: newActiveId,
          messages: newActiveId === null ? [] : state.messages,
        };
      });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  renameConversation: async (id: string, title: string) => {
    try {
      const updated = await tauri.updateConversation(id, title);
      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === id ? updated : c)),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },

  sendMessage: async (content: string) => {
    const { activeConversationId } = get();

    // Auto-create conversation if none active
    let conversationId = activeConversationId;
    if (!conversationId) {
      try {
        const conversation = await tauri.createConversation();
        conversationId = conversation.id;
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: conversation.id,
        }));
      } catch (error) {
        set({ error: String(error) });
        return null;
      }
    }

    set({ isSending: true, error: null });

    try {
      const result = await tauri.sendConversationMessage(conversationId!, content);

      // Optimistically add user message
      set((state) => ({
        messages: [...state.messages, result.userMessage],
      }));

      // Add assistant message after response
      set((state) => ({
        messages: [...state.messages, result.assistantMessage],
        isSending: false,
        // Update conversation in list
        conversations: state.conversations.map((c) =>
          c.id === result.conversation.id ? result.conversation : c,
        ),
      }));

      return result;
    } catch (error) {
      set({ error: String(error), isSending: false });
      return null;
    }
  },

  clearActive: () => {
    set({ activeConversationId: null, messages: [] });
  },
}));
