import { Hono } from "hono";
import { setStorageMode, isCloudConfigured } from "../config/storage-config.js";
import { switchStorageMode, getCurrentMode } from "../db/factory.js";

const app = new Hono();

// GET / - Get current settings
app.get("/", (c) => {
  return c.json({
    storageMode: getCurrentMode(),
    availableModes: ["local", "cloud"],
    cloudConfigured: isCloudConfigured(),
  });
});

// PUT /storage-mode - Switch storage mode
app.put("/storage-mode", async (c) => {
  const body = await c.req.json<{ mode: string }>();

  if (body.mode !== "local" && body.mode !== "cloud") {
    return c.json({ error: "Invalid mode. Must be 'local' or 'cloud'." }, 400);
  }

  if (body.mode === "cloud" && !isCloudConfigured()) {
    return c.json({
      error: "Cloud mode requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be configured.",
    }, 400);
  }

  setStorageMode(body.mode);
  await switchStorageMode(body.mode);

  return c.json({
    storageMode: body.mode,
    message: `Storage mode switched to ${body.mode}.`,
  });
});

export default app;
