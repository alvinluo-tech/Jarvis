import { Hono } from "hono";
import { stream } from "hono/streaming";
import { handleMessage, streamChat } from "../orchestrator/conversation.js";
import type { ModelMessage } from "ai";

const chatRoutes = new Hono();

/**
 * Non-streaming chat endpoint (legacy).
 * Accepts { message: string } and returns full response.
 */
chatRoutes.post("/", async (c) => {
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

/**
 * Streaming chat endpoint.
 * Accepts { messages: ModelMessage[] } and returns SSE stream.
 * Uses Vercel AI SDK streamText with automatic tool calling.
 */
chatRoutes.post("/stream", async (c) => {
  const body = await c.req.json<{ messages: ModelMessage[] }>();

  if (!body.messages?.length) {
    return c.json({ error: "消息不能为空" }, 400);
  }

  const result = streamChat(body.messages);

  return stream(c, async (streamWriter) => {
    streamWriter.onAbort(() => {
      // Client disconnected
    });

    const textStream = result.textStream;
    for await (const chunk of textStream) {
      await streamWriter.write(chunk);
    }
  });
});

export default chatRoutes;
