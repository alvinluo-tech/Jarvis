import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { env } from "../config/env.js";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const dbPath = env.SQLITE_DB_PATH;
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 3,
    status TEXT DEFAULT 'pending',
    due_date TEXT,
    tags TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT 'CURRENT_TIMESTAMP',
    updated_at TEXT DEFAULT 'CURRENT_TIMESTAMP'
  );

  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    url TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'unread',
    rating INTEGER,
    notes TEXT,
    category TEXT,
    added_at TEXT DEFAULT 'CURRENT_TIMESTAMP',
    started_at TEXT,
    finished_at TEXT
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    task_completion_rate REAL,
    articles_read INTEGER,
    summary TEXT,
    patterns TEXT,
    suggestions TEXT,
    raw_data TEXT,
    created_at TEXT DEFAULT 'CURRENT_TIMESTAMP'
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    title TEXT NOT NULL DEFAULT 'New Chat',
    model_used TEXT NOT NULL DEFAULT 'mimo-v2.5-pro',
    message_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT 'CURRENT_TIMESTAMP',
    updated_at TEXT DEFAULT 'CURRENT_TIMESTAMP'
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL DEFAULT '',
    tool_calls TEXT,
    tool_call_id TEXT,
    token_count INTEGER,
    created_at TEXT DEFAULT 'CURRENT_TIMESTAMP'
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
`);

export const db = drizzle(sqlite, { schema });
export { schema };
