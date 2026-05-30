import type { JarvisTool, ToolResult } from "@jarvis/types";
import { registerJarvisTool } from "../../tools/registry.js";
import type { AppConfig, AdapterToolDef } from "./types.js";

/**
 * Register a set of REST API tools from an external app.
 */
export function registerAdapterTools(
  config: AppConfig,
  tools: AdapterToolDef[],
): number {
  for (const toolDef of tools) {
    const tool = createAdapterTool(config, toolDef);
    registerJarvisTool(tool);
  }
  return tools.length;
}

/**
 * Create a JarvisTool from an adapter tool definition.
 */
function createAdapterTool(config: AppConfig, toolDef: AdapterToolDef): JarvisTool {
  return {
    id: `rest:${config.appId}:${toolDef.name}`,
    appId: config.appId,
    source: "rest",
    name: toolDef.name,
    title: toolDef.title,
    description: toolDef.description,
    inputSchema: toolDef.inputSchema,
    risk: toolDef.risk,
    permissions: [],
    requiresConfirmation: toolDef.risk === "high" || toolDef.risk === "critical",
    execute: async (args: unknown): Promise<ToolResult> => {
      try {
        const result = await callRestApi(config, toolDef, args as Record<string, unknown>);
        return {
          success: true,
          data: toolDef.responseTransform ? toolDef.responseTransform(result) : result,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  };
}

/**
 * Call a REST API endpoint.
 */
async function callRestApi(
  config: AppConfig,
  toolDef: AdapterToolDef,
  args: Record<string, unknown>,
): Promise<unknown> {
  let url = `${config.baseUrl}${toolDef.path}`;

  // Replace path params like :id
  url = url.replace(/:(\w+)/g, (_match, key) => {
    const value = args[key];
    delete args[key];
    return String(value ?? "");
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.authToken) {
    headers["Authorization"] = `Bearer ${config.authToken}`;
  }

  const fetchOptions: RequestInit = {
    method: toolDef.method,
    headers,
  };

  if (toolDef.method !== "GET" && Object.keys(args).length > 0) {
    fetchOptions.body = JSON.stringify(args);
  } else if (toolDef.method === "GET" && Object.keys(args).length > 0) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(args)) {
      if (value != null) params.set(key, String(value));
    }
    url += `?${params.toString()}`;
  }

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API error ${response.status}: ${text}`);
  }
  return response.json();
}
