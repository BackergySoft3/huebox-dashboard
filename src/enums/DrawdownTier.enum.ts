export const DrawdownTier = {
  Healthy: "HEALTHY",
  Caution: "CAUTION",
  Danger:  "DANGER",
} as const;

export type DrawdownTier = typeof DrawdownTier[keyof typeof DrawdownTier];
