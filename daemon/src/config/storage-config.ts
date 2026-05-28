import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { env } from "./env.js";

const CONFIG_DIR = join(process.cwd(), "data");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

interface Config {
  storageMode: "local" | "cloud";
}

function readConfig(): Config {
  try {
    if (existsSync(CONFIG_FILE)) {
      const raw = readFileSync(CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.storageMode === "local" || parsed.storageMode === "cloud") {
        return { storageMode: parsed.storageMode };
      }
    }
  } catch {
    // Ignore parse errors, fall back to defaults
  }

  // Fall back to environment variable
  const envMode = env.STORAGE_MODE;
  if (envMode === "cloud") {
    return { storageMode: "cloud" };
  }

  return { storageMode: "local" };
}

function writeConfig(config: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

export function getStorageMode(): "local" | "cloud" {
  return readConfig().storageMode;
}

export function setStorageMode(mode: "local" | "cloud"): void {
  writeConfig({ storageMode: mode });
}

export function isCloudConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}
