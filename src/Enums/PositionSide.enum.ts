export const PositionSide = {
  Long:  "long",
  Short: "short",
} as const;

export type PositionSide = typeof PositionSide[keyof typeof PositionSide];
