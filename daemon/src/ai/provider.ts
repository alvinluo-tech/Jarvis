import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import { env } from "../config/env.js";

export type AIProviderName = "mimo" | "groq" | "openrouter" | "local";

interface ProviderConfig {
  baseURL: string;
  apiKey: string;
}

const PROVIDER_CONFIGS: Record<AIProviderName, ProviderConfig | null> = {
  mimo: null, // dynamic from env
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: "", // from env
  },
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: "", // from env
  },
  local: {
    baseURL: "http://localhost:11434/v1",
    apiKey: "ollama",
  },
};

function getProviderConfig(name: AIProviderName): ProviderConfig {
  switch (name) {
    case "mimo":
      return { baseURL: env.MIMO_API_URL, apiKey: env.MIMO_API_KEY };
    case "groq":
      return { baseURL: PROVIDER_CONFIGS.groq!.baseURL, apiKey: env.GROQ_API_KEY };
    case "openrouter":
      return { baseURL: PROVIDER_CONFIGS.openrouter!.baseURL, apiKey: env.OPENROUTER_API_KEY };
    case "local":
      return { baseURL: env.OLLAMA_BASE_URL ?? PROVIDER_CONFIGS.local!.baseURL, apiKey: "ollama" };
  }
}

export function getProvider(name?: AIProviderName) {
  const providerName = name ?? env.AI_PROVIDER;
  const config = getProviderConfig(providerName);
  return createOpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });
}

export function getModel(providerName?: AIProviderName, modelName?: string): LanguageModelV3 {
  const provider = getProvider(providerName);
  const model = modelName ?? env.AI_MODEL;
  // Use .chat() for Chat Completions API (compatible with MiMo, Groq, OpenRouter, Ollama)
  // The default provider() uses Responses API which most providers don't support
  return provider.chat(model);
}

export function getProviderName(): AIProviderName {
  return env.AI_PROVIDER;
}
