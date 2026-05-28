import { cn } from "@/lib/utils";
import { Wrench } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: { name: string; args: unknown; result: unknown }[];
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="markdown-body">
            <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
          </div>
        )}

        {/* Tool calls indicator */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
            {message.toolCalls.map((tc, i) => (
              <div key={i} className="flex items-center gap-1 text-xs opacity-70">
                <Wrench className="h-3 w-3" />
                <span>{tc.name}</span>
              </div>
            ))}
          </div>
        )}

        <time className="text-xs opacity-50 mt-1 block">
          {message.timestamp.toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </div>
  );
}
