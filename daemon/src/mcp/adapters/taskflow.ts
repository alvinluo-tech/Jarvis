import type { JarvisTool, ToolResult } from "@jarvis/types";
import { registerJarvisTool } from "../../tools/registry.js";
import { getRepositories } from "../../db/factory.js";

/**
 * TaskFlow adapter — exposes Jarvis's native task management as "rest" source tools.
 *
 * TaskFlow is a frontend-only app (localStorage). Instead of calling an external API,
 * this adapter reuses Jarvis's existing task management system, making tasks accessible
 * to MCP clients and external integrations.
 */
export function registerTaskFlowAdapter(): number {
  const tools: JarvisTool[] = [
    {
      id: "rest:taskflow:list_tasks",
      appId: "taskflow",
      source: "rest",
      name: "taskflow_list_tasks",
      title: "List Tasks",
      description: "List tasks with optional status and priority filters",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string", description: "Filter by status: pending, in_progress, done" },
          priority: { type: "number", description: "Filter by priority (1-5)" },
        },
      },
      risk: "low",
      permissions: [],
      requiresConfirmation: false,
      execute: async (args: unknown): Promise<ToolResult> => {
        try {
          const input = (args ?? {}) as Record<string, unknown>;
          const repos = getRepositories();
          const tasks = await repos.tasks.query({
            status: input["status"] as string | undefined,
            priority: input["priority"] as number | undefined,
          });
          return { success: true, data: tasks };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    },
    {
      id: "rest:taskflow:create_task",
      appId: "taskflow",
      source: "rest",
      name: "taskflow_create_task",
      title: "Create Task",
      description: "Create a new task with title, priority, due date, and tags",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          priority: { type: "number", description: "Priority 1-5 (default 3)" },
          dueDate: { type: "string", description: "Due date (ISO string)" },
          tags: { type: "array", items: { type: "string" }, description: "Task tags" },
        },
        required: ["title"],
      },
      risk: "medium",
      permissions: [],
      requiresConfirmation: false,
      execute: async (args: unknown): Promise<ToolResult> => {
        try {
          const input = args as Record<string, unknown>;
          const repos = getRepositories();
          const task = await repos.tasks.create({
            title: input["title"] as string,
            priority: (input["priority"] as number) ?? 3,
            dueDate: (input["dueDate"] as string) ?? null,
            tags: (input["tags"] as string[]) ?? [],
            description: (input["description"] as string) ?? null,
          });
          return { success: true, data: task };
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
      },
    },
  ];

  for (const tool of tools) {
    registerJarvisTool(tool);
  }

  console.log(`[Adapter] Registered TaskFlow tools (${tools.length})`);
  return tools.length;
}
