import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./config/env.js";
import { initializeRepositories, getCurrentMode } from "./db/factory.js";
import { getStorageMode } from "./config/storage-config.js";
import { registerTodoTools } from "./tools/todo/connector.js";
import { registerReadingTools } from "./tools/reading/connector.js";
import { registerReviewTools } from "./tools/review/connector.js";
import { handleMessage } from "./orchestrator/conversation.js";
import conversationRoutes from "./api/conversations.js";
import taskRoutes from "./api/tasks.js";
import articleRoutes from "./api/articles.js";
import reviewRoutes from "./api/reviews.js";
import settingsRoutes from "./api/settings.js";

// Initialize storage mode and repositories
const storageMode = getStorageMode();
initializeRepositories(storageMode);

// Register all tool connectors
registerTodoTools();
registerReadingTools();
registerReviewTools();

const app = new Hono();

app.use("/*", cors());

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    storageMode: getCurrentMode(),
  });
});

// Conversation management routes
app.route("/api/conversations", conversationRoutes);

// Task, Article, Review routes
app.route("/api/tasks", taskRoutes);
app.route("/api/articles", articleRoutes);
app.route("/api/reviews", reviewRoutes);

// Settings routes
app.route("/api/settings", settingsRoutes);

app.post("/api/chat", async (c) => {
  try {
    const body = await c.req.json<{ message: string }>();
    if (!body.message?.trim()) {
      return c.json({ error: "消息不能为空" }, 400);
    }
    const result = await handleMessage(body.message);
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 500);
  }
});

function startServer(port: number) {
  try {
    serve({ fetch: app.fetch, port }, (info) => {
      console.log(`Jarvis Daemon running on http://localhost:${info.port}`);
    }).on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`Port ${port} in use, trying ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error("Server error:", err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

// Show configuration on startup
const aiMode = env.MIMO_API_KEY ? "AI 模式 (MiMo API)" : "本地模式 (无 API Key)";
console.log(`[Jarvis] AI 模式: ${aiMode}`);
console.log(`[Jarvis] API URL: ${env.MIMO_API_URL}`);
console.log(`[Jarvis] 存储模式: ${getCurrentMode()}`);
console.log(`[Jarvis] 数据库: ${env.SQLITE_DB_PATH}`);

startServer(env.DAEMON_PORT);
