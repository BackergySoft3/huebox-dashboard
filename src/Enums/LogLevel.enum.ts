export const LogLevel = {
  Info:   "info",
  Warn:   "warn",
  Error:  "error",
  Debug:  "debug",
  Action: "action",
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];
