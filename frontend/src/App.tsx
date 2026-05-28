import { useCallback, useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ConversationList } from "@/components/chat/ConversationList";
import { TodayView } from "@/components/modules/todo/TodayView";
import { ReadingList } from "@/components/modules/reading/ReadingList";
import { DailySummary } from "@/components/modules/review/DailySummary";
import { VoicePanel } from "@/components/voice/VoicePanel";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

function App() {
  const { messages, sendMessage, isLoading, activeConversationId } = useChat();
  const [showSettings, setShowSettings] = useState(false);

  const handleVoiceCommand = useCallback(
    (text: string) => {
      sendMessage(text);
    },
    [sendMessage],
  );

  const voice = useVoice(handleVoiceCommand);

  // Speak assistant replies
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "assistant" && voice.state === "processing") {
    voice.speak(lastMessage.content);
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left sidebar */}
      <aside className="w-80 border-r border-border flex flex-col overflow-hidden">
        <header className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Jarvis</h1>
            <p className="text-sm text-muted-foreground">Personal Command Center</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="h-8 w-8"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Conversation list */}
          <ConversationList />

          <Separator />

          {/* Voice control */}
          <VoicePanel
            state={voice.state}
            transcript={voice.transcript}
            isSupported={voice.isSupported}
            onToggle={voice.toggleListening}
          />

          <Separator />

          {/* Module views */}
          <TodayView />
          <ReadingList />
          <DailySummary />
        </div>
      </aside>

      {/* Main area - Chat */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatPanel
          messages={messages}
          onSend={sendMessage}
          isLoading={isLoading}
          voiceSpeak={voice.speak}
          hasActiveConversation={!!activeConversationId}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default App;
