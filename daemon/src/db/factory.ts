import type { Repositories } from "./repository.js";
import { createSqliteRepositories } from "./sqlite/index.js";

let currentRepositories: Repositories | null = null;
let currentMode: "local" | "cloud" = "local";

export function createRepositories(mode: "local" | "cloud"): Repositories {
  if (mode === "cloud") {
    // Lazy import to avoid loading Supabase client when not needed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSupabaseRepositories } = require("./supabase/index.js") as {
      createSupabaseRepositories: () => Repositories;
    };
    return createSupabaseRepositories();
  }
  return createSqliteRepositories();
}

export function getRepositories(): Repositories {
  if (!currentRepositories) {
    currentRepositories = createRepositories(currentMode);
  }
  return currentRepositories;
}

export async function switchStorageMode(mode: "local" | "cloud"): Promise<void> {
  currentMode = mode;
  currentRepositories = createRepositories(mode);
}

export function getCurrentMode(): "local" | "cloud" {
  return currentMode;
}

export function initializeRepositories(mode: "local" | "cloud"): void {
  currentMode = mode;
  currentRepositories = createRepositories(mode);
}
