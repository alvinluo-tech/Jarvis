import { getTool, getAllToolDefinitions } from "../tools/registry.js";
import type { ToolCall, ToolDefinition } from "./ai-client.js";

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

export function getAvailableTools(): ToolDefinition[] {
  return getAllToolDefinitions();
}

export async function executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const { id, function: fn } = toolCall;
  const tool = getTool(fn.name);

  if (!tool) {
    return {
      toolCallId: id,
      result: null,
      error: `Unknown tool: ${fn.name}`,
    };
  }

  try {
    const args = JSON.parse(fn.arguments) as Record<string, unknown>;
    const result = await tool.handler(args);
    return { toolCallId: id, result };
  } catch (error) {
    return {
      toolCallId: id,
      result: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
  return Promise.all(toolCalls.map(executeToolCall));
}
