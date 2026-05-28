import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VoiceState } from "@/hooks/useVoice";

interface VoicePanelProps {
  state: VoiceState;
  transcript: string;
  isSupported: boolean;
  onToggle: () => void;
}

const stateLabels: Record<VoiceState, string> = {
  idle: "点击开始语音",
  listening: "正在聆听...",
  "wake-word": "已唤醒，等待指令...",
  processing: "处理中...",
  speaking: "播报中...",
};

const stateColors: Record<VoiceState, string> = {
  idle: "bg-secondary",
  listening: "bg-green-500/20 border-green-500",
  "wake-word": "bg-blue-500/20 border-blue-500",
  processing: "bg-yellow-500/20 border-yellow-500",
  speaking: "bg-purple-500/20 border-purple-500",
};

export function VoicePanel({ state, transcript, isSupported, onToggle }: VoicePanelProps) {
  if (!isSupported) {
    return (
      <div className="text-xs text-muted-foreground text-center py-2">
        当前浏览器不支持语音识别
      </div>
    );
  }

  const isActive = state !== "idle";

  return (
    <div className="space-y-3">
      {/* Voice button */}
      <div className="flex items-center gap-3">
        <Button
          variant={isActive ? "default" : "outline"}
          size="icon"
          onClick={onToggle}
          className={cn(
            "h-10 w-10 rounded-full transition-all",
            isActive && "animate-pulse",
            state === "listening" && "bg-green-600 hover:bg-green-700",
            state === "wake-word" && "bg-blue-600 hover:bg-blue-700",
            state === "speaking" && "bg-purple-600 hover:bg-purple-700",
          )}
        >
          {isActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{stateLabels[state]}</p>
          {transcript && (
            <p className="text-sm truncate mt-0.5">{transcript}</p>
          )}
        </div>

        {state === "speaking" && (
          <Volume2 className="h-4 w-4 text-purple-500 animate-pulse" />
        )}
      </div>

      {/* Wake word hint */}
      {!isActive && (
        <div className="rounded-md border p-2 text-xs bg-secondary">
          <p className="text-muted-foreground">
            说 <span className="font-medium text-foreground">"贾维斯"</span> 唤醒，然后说出指令
          </p>
        </div>
      )}

      {/* Active state indicator */}
      {isActive && (
        <div className={cn("rounded-md border p-2 text-xs", stateColors[state])}>
          {state === "listening" && (
            <p className="text-green-400">🎤 持续聆听中... 可以直接说话或说"贾维斯"唤醒</p>
          )}
          {state === "wake-word" && (
            <p className="text-blue-400">✨ 已唤醒！请说出你的指令</p>
          )}
          {state === "processing" && (
            <p className="text-yellow-400">⏳ 正在处理你的请求...</p>
          )}
          {state === "speaking" && (
            <p className="text-purple-400">🔊 Jarvis 正在回复...</p>
          )}
        </div>
      )}
    </div>
  );
}
