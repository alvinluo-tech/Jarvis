import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../../config/env.js";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
      );
    }
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}

export function resetSupabaseClient(): void {
  client = null;
}
