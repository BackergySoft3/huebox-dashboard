export const ChartInterval = {
  Minutes15:  "15",
  Minutes60:  "60",
  Minutes240: "240",
  Daily:      "D",
} as const;

export type ChartInterval = typeof ChartInterval[keyof typeof ChartInterval];
