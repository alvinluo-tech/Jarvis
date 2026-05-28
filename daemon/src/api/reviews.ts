import { Hono } from "hono";
import { getRepositories } from "../db/factory.js";

const app = new Hono();

// GET /daily-summary - Get daily summary
app.get("/daily-summary", async (c) => {
  const date = c.req.query("date");
  const result = await getRepositories().reviews.getDailySummary(date);
  return c.json(result);
});

// GET /weekly-stats - Get weekly stats
app.get("/weekly-stats", async (c) => {
  const weekStart = c.req.query("weekStart");
  const result = await getRepositories().reviews.getWeeklyStats(weekStart);
  return c.json(result);
});

export default app;
