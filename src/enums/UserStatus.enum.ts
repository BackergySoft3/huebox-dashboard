export const UserStatus = {
  Active:      "ACTIVE",
  Suspended:   "SUSPENDED",
  Blocked:     "BLOCKED",
  Restricted:  "RESTRICTED",
  SoftDeleted: "SOFT_DELETED",
  Deleted:     "DELETED",
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];
