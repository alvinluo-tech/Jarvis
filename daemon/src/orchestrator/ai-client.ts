import { env } from "../config/env.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatCompletion {
  message: {
    role: "assistant";
    content: string | null;
    tool_calls?: ToolCall[];
  };
}

export async function createChatCompletion(
  messages: ChatMessage[],
  tools?: ToolDefinition[],
): Promise<ChatCompletion> {
  const body: Record<string, unknown> = {
    model: "mimo-v2.5-pro",
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const url = `${env.MIMO_API_URL}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // MiMo supports both auth methods
      "api-key": env.MIMO_API_KEY,
      Authorization: `Bearer ${env.MIMO_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiMo API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: [{ message: { role: string; content: string | null; tool_calls?: ToolCall[] } }];
  };

  return {
    message: {
      role: "assistant",
      content: data.choices[0]?.message.content ?? null,
      tool_calls: data.choices[0]?.message.tool_calls,
    },
  };
}
