import type { Tool } from "ai";

const tools = new Map<string, Tool>();

export function registerTool(name: string, toolDef: Tool): void {
  tools.set(name, toolDef);
}

export function getTool(name: string): Tool | undefined {
  return tools.get(name);
}

export function getAllTools(): Record<string, Tool> {
  const result: Record<string, Tool> = {};
  for (const [name, tool] of tools) {
    result[name] = tool;
  }
  return result;
}

export function getAllToolNames(): string[] {
  return Array.from(tools.keys());
}
