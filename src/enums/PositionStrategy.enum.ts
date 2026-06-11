export const PositionStrategy = {
  Grid:    "grid",
  Outlier: "outlier",
} as const;

export type PositionStrategy = typeof PositionStrategy[keyof typeof PositionStrategy];
