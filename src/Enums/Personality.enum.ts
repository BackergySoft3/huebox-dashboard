export const Personality = {
  Safe:       "safe",
  Moderate:   "moderate",
  Balanced:   "balanced",
  Aggressive: "aggressive",
  Insane:     "insane",
  Hunter:     "hunter",
  Sentient:   "sentient",
  Brain:      "brain",
} as const;

export type Personality = typeof Personality[keyof typeof Personality];
