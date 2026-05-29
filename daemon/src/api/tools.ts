import { Hono } from "hono";
import type { ToolSource, RiskLevel } from "@jarvis/types";
import { getRegistry } from "../tools/registry.js";

const app = new Hono();

// List all registered tools
app.get("/", (c) => {
  const registry = getRegistry();
  const tools = registry.getAllTools().map((t) => ({
    id: t.id,
    appId: t.appId,
    source: t.source,
    name: t.name,
    title: t.title,
    description: t.description,
    risk: t.risk,
    permissions: t.permissions,
    requiresConfirmation: t.requiresConfirmation,
    inputSchema: t.inputSchema,
  }));

  return c.json({
    tools,
    count: tools.length,
    bySource: {
      native: registry.getToolsBySource("native").length,
      mcp: registry.getToolsBySource("mcp").length,
      skill: registry.getToolsBySource("skill").length,
      rest: registry.getToolsBySource("rest").length,
    },
  });
});

// Get a specific tool
app.get("/:id", (c) => {
  const registry = getRegistry();
  const toolId = c.req.param("id");
  const tool = registry.getTool(toolId);

  if (!tool) {
    return c.json({ error: "Tool not found" }, 404);
  }

  return c.json({
    id: tool.id,
    appId: tool.appId,
    source: tool.source,
    name: tool.name,
    title: tool.title,
    description: tool.description,
    risk: tool.risk,
    permissions: tool.permissions,
    requiresConfirmation: tool.requiresConfirmation,
    inputSchema: tool.inputSchema,
  });
});

// Filter tools
app.post("/filter", async (c) => {
  const registry = getRegistry();
  const filter = await c.req.json<{
    appId?: string;
    source?: ToolSource;
    risk?: RiskLevel;
    search?: string;
  }>();

  const tools = registry.filterTools(filter).map((t) => ({
    id: t.id,
    appId: t.appId,
    source: t.source,
    name: t.name,
    title: t.title,
    description: t.description,
    risk: t.risk,
  }));

  return c.json({ tools, count: tools.length });
});

// Execute a tool (with permission guard)
app.post("/:id/execute", async (c) => {
  const registry = getRegistry();
  const toolId = c.req.param("id");
  const args = await c.req.json<unknown>();

  const tool = registry.getTool(toolId);
  if (!tool) {
    return c.json({ error: "Tool not found" }, 404);
  }

  try {
    const result = await tool.execute(args);
    return c.json(result);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

export default app;
