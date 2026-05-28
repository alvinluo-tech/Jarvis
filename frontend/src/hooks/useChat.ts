import { useCallback, useRef, useState } from "react";
import { useConversationStore } from "@/stores/conversationStore";
import type { ConversationMessage } from "@/lib/tauri";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: { name: string; args: unknown; result: unknown }[];
  isStreaming?: boolean;
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

const DAEMON_URL = "http://localhost:3001";

export function useChat() {
  const {
    messages: rawMessages,
    isSending,
    activeConversationId,
    sendMessage: storeSendMessage,
    createConversation,
  } = useConversationStore();

  const [streamingContent, setStreamingContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const messages: Message[] = rawMessages.map(convertMessage);

  // Non-streaming send (via Tauri IPC, preserves conversation)
  const sendMessage = useCallback(
    async (text: string) => {
      return storeSendMessage(text);
    },
    [storeSendMessage],
  );

  // Streaming send (direct HTTP to daemon)
  const sendStreamingMessage = useCallback(
    async (text: string) => {
      // Ensure conversation exists
      let conversationId = activeConversationId;
      if (!conversationId) {
        const conversation = await createConversation();
        conversationId = conversation.id;
      }

      setIsStreaming(true);
      setStreamingContent("");

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch(`${DAEMON_URL}/api/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: text },
            ],
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setStreamingContent(fullContent);
        }

        // After streaming completes, persist via conversation store
        await storeSendMessage(text);
        setStreamingContent("");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Streaming error:", error);
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [activeConversationId, createConversation, messages, storeSendMessage],
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const startNewChat = useCallback(async () => {
    return createConversation();
  }, [createConversation]);

  return {
    messages,
    sendMessage,
    sendStreamingMessage,
    stopStreaming,
    startNewChat,
    isLoading: isSending,
    isStreaming,
    streamingContent,
    activeConversationId,
  };
}
