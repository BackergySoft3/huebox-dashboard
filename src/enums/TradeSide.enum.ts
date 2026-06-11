export const TradeSide = {
  Buy:  "Buy",
  Sell: "Sell",
} as const;

export type TradeSide = typeof TradeSide[keyof typeof TradeSide];
