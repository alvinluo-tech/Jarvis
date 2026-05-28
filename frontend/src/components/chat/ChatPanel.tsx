import { MessageSquarePlus } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";
import type { Message } from "@/hooks/useChat";
import { useConversationStore } from "@/stores/conversationStore";

interface ChatPanelProps {
  messages: Message[];
  onSend: (text: string) => void;
  isLoading: boolean;
  voiceSpeak?: (text: string) => void;
  hasActiveConversation: boolean;
}

export function ChatPanel({ messages, onSend, isLoading, hasActiveConversation }: ChatPanelProps) {
  const createConversation = useConversationStore((s) => s.createConversation);

  if (!hasActiveConversation) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <MessageSquarePlus className="h-16 w-16 mb-4 opacity-30" />
        <h2 className="text-lg font-medium mb-2">开始新对话</h2>
        <p className="text-sm mb-6">选择一个对话或创建新对话开始</p>
        <Button onClick={() => createConversation()} className="gap-2">
          新建对话
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-lg px-4 py-2 text-sm">
              <span className="animate-pulse">思考中...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4">
        <ChatInput onSend={onSend} disabled={isLoading} />
      </div>
    </div>
  );
}
