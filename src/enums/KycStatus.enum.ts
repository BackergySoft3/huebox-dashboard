export const KycStatus = {
  Pending:  "pending",
  Approved: "verified",
  Rejected: "rejected",
  All:      "all",
} as const;

export type KycStatus = typeof KycStatus[keyof typeof KycStatus];
