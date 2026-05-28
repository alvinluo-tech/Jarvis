import { Hono } from "hono";
import { getRepositories } from "../db/factory.js";
import { handleMessageInConversation } from "../orchestrator/conversation.js";

const app = new Hono();

// GET / - List all conversations
app.get("/", async (c) => {
  const conversations = await getRepositories().conversations.list();
  return c.json({ conversations });
});

// POST / - Create a new conversation
app.post("/", async (c) => {
  const body: { title?: string } = await c.req.json<{ title?: string }>().catch(() => ({ title: undefined }));
  const conversation = await getRepositories().conversations.create(body.title);
  return c.json({ conversation }, 201);
});

// GET /:id - Get conversation with messages
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const conversation = await getRepositories().conversations.getById(id);
  if (!conversation) {
    return c.json({ error: "Conversation not found" }, 404);
  }
  const messages = await getRepositories().conversations.getMessages(id);
  return c.json({ conversation, messages });
});

// DELETE /:id - Delete conversation
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const deleted = await getRepositories().conversations.delete(id);
  if (!deleted) {
    return c.json({ error: "Conversation not found" }, 404);
  }
  return c.json({ success: true });
});

// PATCH /:id - Update conversation (rename)
app.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body: { title?: string } = await c.req.json<{ title?: string }>().catch(() => ({ title: undefined }));
  const conversation = await getRepositories().conversations.update(id, body);
  if (!conversation) {
    return c.json({ error: "Conversation not found" }, 404);
  }
  return c.json({ conversation });
});

// POST /:id/messages - Send a message in conversation
app.post("/:id/messages", async (c) => {
  const id = c.req.param("id");
  const conversation = await getRepositories().conversations.getById(id);
  if (!conversation) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  const body = await c.req.json<{ content: string }>();
  if (!body.content?.trim()) {
    return c.json({ error: "Message content is required" }, 400);
  }

  try {
    const result = await handleMessageInConversation(id, body.content);
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return c.json({ error: message }, 500);
  }
});

export default app;
