import type { ToolDefinition } from "../orchestrator/ai-client.js";

export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}

const tools = new Map<string, RegisteredTool>();

export function registerTool(definition: ToolDefinition, handler: ToolHandler): void {
  tools.set(definition.function.name, { definition, handler });
}

export function getTool(name: string): RegisteredTool | undefined {
  return tools.get(name);
}

export function getAllToolDefinitions(): ToolDefinition[] {
  return Array.from(tools.values()).map((t) => t.definition);
}

export function getAllToolNames(): string[] {
  return Array.from(tools.keys());
}
