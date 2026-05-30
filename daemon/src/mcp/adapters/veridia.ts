import { registerAdapterTools } from "./base.js";
import type { AppConfig, AdapterToolDef } from "./types.js";

const veridiaTools: AdapterToolDef[] = [
  {
    name: "veridia_search_media",
    title: "Search Media",
    description: "Search for books, movies, TV shows, articles, and courses in Veridia",
    risk: "low",
    method: "GET",
    path: "/api/jarvis/search",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search query" },
        type: { type: "string", description: "Media type filter: book, movie, tv, article, course" },
        status: { type: "string", description: "Status filter: planned, in_progress, completed, paused, dropped" },
        limit: { type: "number", description: "Max results (default 20)" },
      },
      required: ["q"],
    },
  },
  {
    name: "veridia_add_media",
    title: "Add Media",
    description: "Add a new media item to Veridia library",
    risk: "medium",
    method: "POST",
    path: "/api/jarvis/media",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Media title" },
        type: { type: "string", description: "Media type: book, movie, tv, article, course" },
        status: { type: "string", description: "Initial status (default: planned)" },
        notes: { type: "string", description: "Initial notes" },
      },
      required: ["title", "type"],
    },
  },
  {
    name: "veridia_update_media",
    title: "Update Media Status",
    description: "Update media status, progress, or rating in Veridia",
    risk: "medium",
    method: "PATCH",
    path: "/api/jarvis/media/:id",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Media item ID" },
        status: { type: "string", description: "New status" },
        progress: { type: "number", description: "Progress percentage" },
        rating: { type: "number", description: "Rating (1-5)" },
      },
      required: ["id"],
    },
  },
  {
    name: "veridia_get_notes",
    title: "Get Media Notes",
    description: "Retrieve notes and reflections for a media item",
    risk: "low",
    method: "GET",
    path: "/api/jarvis/media/:id/notes",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Media item ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "veridia_add_note",
    title: "Add Note",
    description: "Add a reflection note to a media item",
    risk: "medium",
    method: "POST",
    path: "/api/jarvis/media/:id/notes",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Media item ID" },
        content: { type: "string", description: "Note content" },
        location: { type: "string", description: "Location reference (page, timestamp, etc.)" },
      },
      required: ["id", "content"],
    },
  },
  {
    name: "veridia_get_insights",
    title: "Get Insights",
    description: "Get consumption analytics and insights from Veridia",
    risk: "low",
    method: "GET",
    path: "/api/jarvis/insights",
    inputSchema: {
      type: "object",
      properties: {
        period: { type: "string", description: "Time period: week, month, year, all" },
      },
    },
  },
];

/**
 * Register Veridia adapter tools.
 * Requires VERIDIA_BASE_URL and optionally VERIDIA_AUTH_TOKEN in env.
 */
export function registerVeridiaAdapter(): number {
  const baseUrl = process.env["VERIDIA_BASE_URL"];
  if (!baseUrl) {
    console.log("[Adapter] VERIDIA_BASE_URL not set, skipping Veridia adapter");
    return 0;
  }

  const config: AppConfig = {
    appId: "veridia",
    name: "Veridia",
    baseUrl,
    authToken: process.env["VERIDIA_AUTH_TOKEN"],
  };

  console.log(`[Adapter] Registering Veridia tools (${veridiaTools.length})`);
  return registerAdapterTools(config, veridiaTools);
}
