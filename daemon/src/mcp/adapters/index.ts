export { registerAdapterTools } from "./base.js";
export type { AppConfig, AdapterToolDef } from "./types.js";

export { registerVeridiaAdapter } from "./veridia.js";
export { registerTaskFlowAdapter } from "./taskflow.js";
export { registerFlexiLogAdapter } from "./flexilog.js";

import { registerVeridiaAdapter } from "./veridia.js";
import { registerTaskFlowAdapter } from "./taskflow.js";
import { registerFlexiLogAdapter } from "./flexilog.js";

/**
 * Register all external app adapters.
 * Each adapter checks for required env vars and skips if not configured.
 */
export function registerAllAdapters(): number {
  let total = 0;
  total += registerVeridiaAdapter();
  total += registerTaskFlowAdapter();
  total += registerFlexiLogAdapter();
  console.log(`[Adapters] Registered ${total} external tools`);
  return total;
}
