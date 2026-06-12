/**
 * @deprecated Use the split stores directly:
 *   - auth  → import { useAuthStore } from "./auth"
 *   - bot   → import { useBotStore }  from "./bot"
 *   - logs  → import { useLogsStore } from "./logs"
 *
 * This shim re-exports everything to avoid breaking any remaining imports
 * while migration is in progress. Remove once all references are updated.
 */

export { useAuthStore } from "./auth";
export { useBotStore }  from "./bot";
export { useLogsStore } from "./logs";
export type { LogLine } from "./logs";

// Legacy alias — points to authStore for backwards-compat
export { useAuthStore as useStore } from "./auth";
