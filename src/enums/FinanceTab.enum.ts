export const FinanceTab = {
  Transactions: "transactions",
  Deposits:     "deposits",
  Fees:         "fees",
} as const;

export type FinanceTab = typeof FinanceTab[keyof typeof FinanceTab];
