export const TransactionStatus = {
  Pending:   "pending",
  Completed: "completed",
  Confirmed: "confirmed",
  Failed:    "failed",
} as const;

export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];
