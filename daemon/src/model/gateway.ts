import { ModelGateway, DEFAULT_PROFILES, DEFAULT_ROUTING_RULES } from "@jarvis/model-gateway";
import type { ModelProviderName, ProviderConfig } from "@jarvis/types";
import { env } from "../config/env.js";

let gateway: ModelGateway | null = null;

export function getModelGateway(): ModelGateway {
  if (gateway) return gateway;

  const providers: Record<ModelProviderName, ProviderConfig> = {
    mimo: {
      baseURL: env.MIMO_API_URL,
      apiKey: env.MIMO_API_KEY,
      models: DEFAULT_PROFILES.filter((p) => p.provider === "mimo"),
    },
    groq: {
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: env.GROQ_API_KEY,
      models: DEFAULT_PROFILES.filter((p) => p.provider === "groq"),
    },
    openrouter: {
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: env.OPENROUTER_API_KEY,
      models: DEFAULT_PROFILES.filter((p) => p.provider === "openrouter"),
    },
    local: {
      baseURL: env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
      apiKey: "ollama",
      models: DEFAULT_PROFILES.filter((p) => p.provider === "local"),
    },
  };

  gateway = new ModelGateway({
    defaultModelId: getDefaultModelId(),
    routingRules: DEFAULT_ROUTING_RULES,
    providers,
    profiles: DEFAULT_PROFILES,
  });

  return gateway;
}

function getDefaultModelId(): string {
  const provider = env.AI_PROVIDER;
  const model = env.AI_MODEL;

  // Match to a known profile
  for (const profile of DEFAULT_PROFILES) {
    if (profile.provider === provider && profile.modelName === model) {
      return profile.id;
    }
  }

  // Fallback based on provider
  switch (provider) {
    case "mimo": return "mimo-2.5-pro";
    case "groq": return "groq-llama";
    case "openrouter": return "openrouter-default";
    case "local": return "local-ollama";
    default: return "mimo-2.5-pro";
  }
}
