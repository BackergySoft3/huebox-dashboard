export const BotRegime = {
  Scouting: "SCOUTING",
  Farming:  "FARMING",
} as const;

export type BotRegime = typeof BotRegime[keyof typeof BotRegime];
