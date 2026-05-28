import { eq, desc, sql } from "drizzle-orm";
import { db, schema } from "./client.js";

export interface ConversationRow {
  id: string;
  userId: string;
  title: string;
  modelUsed: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRow {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls: string | null;
  toolCallId: string | null;
  tokenCount: number | null;
  createdAt: string;
}

function generateId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// ---- Conversations ----

export function createConversation(title?: string): ConversationRow {
  const id = generateId();
  const timestamp = now();
  db.insert(schema.conversations)
    .values({
      id,
      title: title ?? "New Chat",
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
  return {
    id,
    userId: "default",
    title: title ?? "New Chat",
    modelUsed: "mimo-v2.5-pro",
    messageCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function listConversations(): ConversationRow[] {
  return db
    .select()
    .from(schema.conversations)
    .orderBy(desc(schema.conversations.updatedAt))
    .all();
}

export function getConversation(id: string): ConversationRow | undefined {
  return db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.id, id))
    .get();
}

export function deleteConversation(id: string): boolean {
  const result = db
    .delete(schema.conversations)
    .where(eq(schema.conversations.id, id))
    .run();
  return result.changes > 0;
}

export function updateConversation(
  id: string,
  data: { title?: string },
): ConversationRow | undefined {
  const updates: Record<string, unknown> = { updatedAt: now() };
  if (data.title !== undefined) updates.title = data.title;

  db.update(schema.conversations)
    .set(updates)
    .where(eq(schema.conversations.id, id))
    .run();

  return getConversation(id);
}

// ---- Messages ----

export function addMessage(
  conversationId: string,
  data: {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    toolCalls?: unknown[];
    toolCallId?: string;
    tokenCount?: number;
  },
): MessageRow {
  const id = generateId();
  const timestamp = now();

  db.insert(schema.messages)
    .values({
      id,
      conversationId,
      role: data.role,
      content: data.content,
      toolCalls: data.toolCalls ? JSON.stringify(data.toolCalls) : null,
      toolCallId: data.toolCallId ?? null,
      tokenCount: data.tokenCount ?? null,
      createdAt: timestamp,
    })
    .run();

  // Update conversation metadata
  db.update(schema.conversations)
    .set({
      messageCount: sql`${schema.conversations.messageCount} + 1`,
      updatedAt: timestamp,
    })
    .where(eq(schema.conversations.id, conversationId))
    .run();

  return {
    id,
    conversationId,
    role: data.role,
    content: data.content,
    toolCalls: data.toolCalls ? JSON.stringify(data.toolCalls) : null,
    toolCallId: data.toolCallId ?? null,
    tokenCount: data.tokenCount ?? null,
    createdAt: timestamp,
  };
}

export function getMessages(conversationId: string): MessageRow[] {
  return db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .all();
}

export function getMessageCount(conversationId: string): number {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .get();
  return result?.count ?? 0;
}

// ---- Title Generation ----

export function generateTitleFromMessage(message: string): string {
  // Simple heuristic: first 50 chars, cleaned up
  const cleaned = message.replace(/\n/g, " ").trim();
  if (cleaned.length <= 50) return cleaned;
  return cleaned.slice(0, 47) + "...";
}
