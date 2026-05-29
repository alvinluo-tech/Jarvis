import { eq, desc } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { db as defaultDb, schema } from "../client.js";
import type {
  AgentRunRepository,
  AgentRunRow,
  CreateAgentRunInput,
} from "../repository.js";

type DrizzleDb = BetterSQLite3Database<typeof schema>;

export function createSqliteAgentRunRepo(database?: DrizzleDb): AgentRunRepository {
  const db = database ?? defaultDb;
  return {
    async create(input: CreateAgentRunInput): Promise<AgentRunRow> {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      db.insert(schema.agentRuns)
        .values({
          id,
          conversationId: input.conversationId ?? null,
          userMessageId: input.userMessageId ?? null,
          assistantMessageId: input.assistantMessageId ?? null,
          selectedModel: input.selectedModel ?? null,
          routeReason: input.routeReason ?? null,
          startedAt: now,
        })
        .run();
      const row = db
        .select()
        .from(schema.agentRuns)
        .where(eq(schema.agentRuns.id, id))
        .get()!;
      return row;
    },

    async getById(id: string): Promise<AgentRunRow | null> {
      const row = db
        .select()
        .from(schema.agentRuns)
        .where(eq(schema.agentRuns.id, id))
        .get();
      return row ?? null;
    },

    async getByConversation(conversationId: string): Promise<AgentRunRow[]> {
      return db
        .select()
        .from(schema.agentRuns)
        .where(eq(schema.agentRuns.conversationId, conversationId))
        .all();
    },

    async getRecent(limit = 50): Promise<AgentRunRow[]> {
      return db
        .select()
        .from(schema.agentRuns)
        .orderBy(desc(schema.agentRuns.startedAt))
        .limit(limit)
        .all();
    },

    async updateStatus(
      id: string,
      status: AgentRunRow["status"],
      error?: string,
    ): Promise<void> {
      const now = new Date().toISOString();
      const existing = db
        .select()
        .from(schema.agentRuns)
        .where(eq(schema.agentRuns.id, id))
        .get();
      const durationMs = existing
        ? Date.now() - new Date(existing.startedAt).getTime()
        : null;
      db.update(schema.agentRuns)
        .set({
          status,
          completedAt: now,
          durationMs,
          error: error ?? null,
        })
        .where(eq(schema.agentRuns.id, id))
        .run();
    },
  };
}
