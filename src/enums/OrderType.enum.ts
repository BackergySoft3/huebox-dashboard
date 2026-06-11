export const OrderType = {
  Market: "Market",
  Limit:  "Limit",
} as const;

export type OrderType = typeof OrderType[keyof typeof OrderType];
