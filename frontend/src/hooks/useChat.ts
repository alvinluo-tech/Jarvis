import { useCallback } from "react";
import { useConversationStore } from "@/stores/conversationStore";
import type { ConversationMessage, SendMessageResponse } from "@/lib/tauri";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: { name: string; args: unknown; result: unknown }[];
}

function convertMessage(msg: ConversationMessage): Message {
  return {
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    timestamp: new Date(msg.createdAt),
    toolCalls: msg.toolCalls ? JSON.parse(msg.toolCalls) : undefined,
  };
}

export function useChat() {
  const {
    messages: rawMessages,
    isSending,
    activeConversationId,
    sendMessage: storeSendMessage,
    createConversation,
  } = useConversationStore();

  const messages: Message[] = rawMessages.map(convertMessage);

  const sendMessage = useCallback(
    async (text: string): Promise<SendMessageResponse | null> => {
      return storeSendMessage(text);
    },
    [storeSendMessage],
  );

  const startNewChat = useCallback(async () => {
    return createConversation();
  }, [createConversation]);

  return {
    messages,
    sendMessage,
    startNewChat,
    isLoading: isSending,
    activeConversationId,
  };
}
