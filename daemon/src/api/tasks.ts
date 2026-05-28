import { Hono } from "hono";
import { getRepositories } from "../db/factory.js";

const app = new Hono();

// GET / - Query tasks
app.get("/", async (c) => {
  const status = c.req.query("status");
  const priority = c.req.query("priority");

  const tasks = await getRepositories().tasks.query({
    status: status ?? undefined,
    priority: priority ? Number(priority) : undefined,
  });

  return c.json({ tasks, count: tasks.length });
});

// POST / - Create task
app.post("/", async (c) => {
  const body = await c.req.json<{
    title: string;
    priority?: number;
    dueDate?: string;
    tags?: string[];
    description?: string;
  }>();

  if (!body.title?.trim()) {
    return c.json({ error: "Title is required" }, 400);
  }

  const task = await getRepositories().tasks.create({
    title: body.title,
    description: body.description,
    priority: body.priority,
    dueDate: body.dueDate,
    tags: body.tags,
  });

  return c.json({ task }, 201);
});

// PATCH /:id - Update task
app.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    title?: string;
    priority?: number;
    status?: string;
    dueDate?: string;
    tags?: string[];
  }>();

  try {
    const task = await getRepositories().tasks.update(id, body);
    return c.json({ task });
  } catch {
    return c.json({ error: "Task not found" }, 404);
  }
});

// DELETE /:id - Soft delete task
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await getRepositories().tasks.delete(id);
  return c.json({ success: true });
});

export default app;
