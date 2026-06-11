export const KycStatus = {
  Pending:  "pending",
  Approved: "approved",
  Rejected: "rejected",
  All:      "all",
} as const;

export type KycStatus = typeof KycStatus[keyof typeof KycStatus];
