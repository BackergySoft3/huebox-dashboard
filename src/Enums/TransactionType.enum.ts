export const TransactionType = {
  Deposit:    "deposit",
  Withdrawal: "withdrawal",
  Transfer:   "transfer",
  Send:       "send",
  Receive:    "receive",
  Withdraw:   "withdraw",
  Fee:        "fee",
  Pnl:        "pnl",
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];
