import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Brain, Zap, Wrench, Eye, BookOpen, Shield, Cpu } from "lucide-react";
import { useMCPStore } from "@/stores/mcpStore";

const defaultRoutes = [
  { purpose: "默认聊天", model: "MiMo v2.5 Pro", icon: Brain },
  { purpose: "快速响应", model: "Groq Llama Fast", icon: Zap },
  { purpose: "工具调用", model: "MiMo v2.5 Pro", icon: Wrench },
  { purpose: "深度推理", model: "MiMo v2.5 Pro", icon: Cpu },
  { purpose: "隐私模式", model: "Ollama Local", icon: Shield },
];

export function ModelsPage() {
  const { modelProfiles, fetchModelProfiles, isLoading } = useMCPStore();

  useEffect(() => {
    fetchModelProfiles();
  }, [fetchModelProfiles]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">模型管理</h2>
        <p className="text-sm text-muted-foreground">AI 模型配置和能力</p>
      </div>

      {/* Default routing rules */}
      <Card className="p-5">
        <h3 className="text-sm font-medium mb-4">默认路由规则</h3>
        <div className="space-y-2">
          {defaultRoutes.map((route) => {
            const Icon = route.icon;
            return (
              <div
                key={route.purpose}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{route.purpose}</span>
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  {route.model}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Model Profiles */}
      <Card className="p-5">
        <h3 className="text-sm font-medium mb-4">
          模型配置文件
          {isLoading && (
            <span className="text-xs text-muted-foreground ml-2">加载中...</span>
          )}
        </h3>
        <div className="space-y-3">
          {modelProfiles.map((profile) => (
            <div
              key={profile.id}
              className="p-4 rounded-lg border bg-card space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{profile.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.provider} / {profile.modelName}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {profile.capabilities.toolCalling && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">
                      工具调用
                    </span>
                  )}
                  {profile.capabilities.vision && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600">
                      <Eye className="h-3 w-3 inline mr-0.5" />
                      视觉
                    </span>
                  )}
                  {profile.capabilities.longContext && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-600">
                      <BookOpen className="h-3 w-3 inline mr-0.5" />
                      长上下文
                    </span>
                  )}
                  {profile.capabilities.tts && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600">
                      TTS
                    </span>
                  )}
                  {profile.capabilities.jsonMode && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600">
                      JSON
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>上下文: {(profile.limits.contextWindow / 1000).toFixed(0)}K</span>
                <span>最大输出: {(profile.limits.maxOutputTokens / 1000).toFixed(0)}K</span>
                <span>
                  成本: ${profile.cost.input}/M入 · ${profile.cost.output}/M出
                </span>
              </div>
            </div>
          ))}
          {modelProfiles.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              暂无模型配置
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
