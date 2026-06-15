export const KycStatus = {
  Pending:  "pending",
  InReview: "in_review",
  Approved: "verified",
  Rejected: "rejected",
  All:      "all",
} as const;

export type KycStatus = typeof KycStatus[keyof typeof KycStatus];
