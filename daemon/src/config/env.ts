import "dotenv/config";

function getEnvVar(key: string, fallbackKeys: string[] = [], defaultValue?: string): string {
  let value = process.env[key];
  if (!value) {
    for (const fallback of fallbackKeys) {
      value = process.env[fallback];
      if (value) break;
    }
  }
  if (!value && defaultValue !== undefined) {
    value = defaultValue;
  }
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  // Support both MIMO_API_KEY and XIAOMI_API_KEY
  MIMO_API_KEY: getEnvVar("MIMO_API_KEY", ["XIAOMI_API_KEY"], ""),
  MIMO_API_URL: getEnvVar("MIMO_API_URL", ["XIAOMI_API_URL", "OPENAI_API_BASE_URL"], "https://token-plan-ams.xiaomimimo.com/v1"),
  SUPABASE_URL: getEnvVar("SUPABASE_URL", [], ""),
  SUPABASE_ANON_KEY: getEnvVar("SUPABASE_ANON_KEY", [], ""),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar("SUPABASE_SERVICE_ROLE_KEY", [], ""),
  STORAGE_MODE: getEnvVar("STORAGE_MODE", [], "local") as "local" | "cloud",
  SQLITE_DB_PATH: getEnvVar("SQLITE_DB_PATH", [], "./data/jarvis.db"),
  DAEMON_PORT: parseInt(getEnvVar("DAEMON_PORT", [], "3001"), 10),
  DAEMON_HOST: getEnvVar("DAEMON_HOST", [], "localhost"),
} as const;
