import { Hono } from "hono";
import { getRepositories } from "../db/factory.js";

const app = new Hono();

// GET / - Get reading list
app.get("/", async (c) => {
  const status = c.req.query("status");
  const category = c.req.query("category");
  const limit = c.req.query("limit");

  const articles = await getRepositories().articles.list({
    status: status ?? undefined,
    category: category ?? undefined,
    limit: limit ? Number(limit) : undefined,
  });

  return c.json({ articles, count: articles.length });
});

// POST / - Add article
app.post("/", async (c) => {
  const body = await c.req.json<{
    title: string;
    url?: string;
    category?: string;
    description?: string;
  }>();

  if (!body.title?.trim()) {
    return c.json({ error: "Title is required" }, 400);
  }

  const article = await getRepositories().articles.create({
    title: body.title,
    url: body.url,
    category: body.category,
    description: body.description,
  });

  return c.json({ article }, 201);
});

// PATCH /:id - Update reading status
app.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    status?: string;
    rating?: number;
    notes?: string;
  }>();

  try {
    const article = await getRepositories().articles.update(id, body);
    return c.json({ article });
  } catch {
    return c.json({ error: "Article not found" }, 404);
  }
});

export default app;
