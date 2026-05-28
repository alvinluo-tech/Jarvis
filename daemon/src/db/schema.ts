import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: integer("priority").default(3).notNull(), // 1-5, 1=highest
  status: text("status", { enum: ["pending", "in_progress", "done", "deleted"] })
    .default("pending")
    .notNull(),
  dueDate: text("due_date"), // ISO date
  tags: text("tags"), // JSON array stored as text
  completedAt: text("completed_at"), // ISO datetime
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  url: text("url"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["unread", "reading", "finished"] })
    .default("unread")
    .notNull(),
  rating: integer("rating"), // 1-5
  notes: text("notes"),
  category: text("category"),
  addedAt: text("added_at").default("CURRENT_TIMESTAMP").notNull(),
  startedAt: text("started_at"),
  finishedAt: text("finished_at"),
});

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type", { enum: ["daily", "weekly"] }).notNull(),
  periodStart: text("period_start").notNull(), // ISO date
  periodEnd: text("period_end").notNull(), // ISO date
  taskCompletionRate: real("task_completion_rate"),
  articlesRead: integer("articles_read"),
  summary: text("summary"),
  patterns: text("patterns"), // JSON array stored as text
  suggestions: text("suggestions"), // JSON array stored as text
  rawData: text("raw_data"), // JSON object stored as text
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});

// ---- Conversation Management ----

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default("default"),
  title: text("title").notNull().default("New Chat"),
  modelUsed: text("model_used").notNull().default("mimo-v2.5-pro"),
  messageCount: integer("message_count").notNull().default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP").notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system", "tool"] }).notNull(),
  content: text("content").notNull().default(""),
  toolCalls: text("tool_calls"), // JSON array stored as text
  toolCallId: text("tool_call_id"),
  tokenCount: integer("token_count"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
});
