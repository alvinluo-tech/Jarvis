import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { Mic, Volume2, Radio, User } from "lucide-react";
import { voiceProfileManager } from "@/lib/voiceProfile";
import { getVoiceStatus, type VoiceStatus } from "@/lib/tauri";

export function VoicePage() {
  const profile = voiceProfileManager.getActiveProfile();
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null);

  useEffect(() => {
    getVoiceStatus().then(setVoiceStatus).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">语音系统</h2>
        <p className="text-sm text-muted-foreground">语音配置和状态（只读）</p>
      </div>

      {/* Voice Profile Card */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          语音配置
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">名称</p>
            <p className="text-sm font-medium mt-0.5">{profile.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">语言</p>
            <p className="text-sm mt-0.5">{profile.language}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">模型</p>
            <p className="text-sm font-mono mt-0.5">{profile.model}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">性别</p>
            <p className="text-sm mt-0.5">
              {profile.gender === "female" ? "女" : profile.gender === "male" ? "男" : "中性"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">风格</p>
            <p className="text-sm mt-0.5">{profile.style}</p>
          </div>
        </div>
      </Card>

      {/* Voice System Status */}
      <Card className="p-5 space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Radio className="h-4 w-4 text-muted-foreground" />
          系统状态
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <Mic className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">ASR (语音识别)</span>
            </div>
            <StatusBadge
              status={voiceStatus?.asr ? "healthy" : "error"}
              label={voiceStatus?.asr ? "可用" : "不可用"}
            />
          </div>
          <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">TTS (语音合成)</span>
            </div>
            <StatusBadge
              status={voiceStatus?.tts?.available ? "healthy" : "error"}
              label={
                voiceStatus?.tts?.available
                  ? `${voiceStatus.tts.provider}`
                  : "不可用"
              }
            />
          </div>
          <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">VAD (语音活动检测)</span>
            </div>
            <StatusBadge
              status={voiceStatus?.vad?.available ? "healthy" : "warning"}
              label={voiceStatus?.vad?.available ? "可用" : voiceStatus?.vad?.note ?? "未知"}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
