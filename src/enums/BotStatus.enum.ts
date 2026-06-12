export const BotStatus = {
  Running: "running",
  Stalled: "stalled",
  Stopped: "stopped",
  Paused:  "paused",
} as const;

export type BotStatus = typeof BotStatus[keyof typeof BotStatus];
