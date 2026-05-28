import { useState } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/tauri";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHour < 24) return `${diffHour} 小时前`;
  if (diffDay < 7) return `${diffDay} 天前`;
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const [showDelete, setShowDelete] = useState(false);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== conversation.title) {
      onRename(conversation.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRename();
    if (e.key === "Escape") {
      setEditTitle(conversation.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50",
      )}
      onClick={() => onSelect(conversation.id)}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-6 text-sm bg-transparent border-b border-primary px-0 py-0 focus:outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleRename(); }}
              className="p-0.5 hover:bg-primary/20 rounded"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditTitle(conversation.title); }}
              className="p-0.5 hover:bg-destructive/20 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium truncate">{conversation.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(conversation.updatedAt)} · {conversation.messageCount} 条消息
            </p>
          </>
        )}
      </div>

      {!isEditing && showDelete && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="p-1 hover:bg-primary/20 rounded"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(conversation.id); }}
            className="p-1 hover:bg-destructive/20 rounded"
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </button>
        </div>
      )}
    </div>
  );
}
