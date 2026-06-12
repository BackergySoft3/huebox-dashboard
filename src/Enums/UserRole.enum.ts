export const UserRole = {
  User:       "USER",
  Admin:      "ADMIN",
  SuperAdmin: "SUPERADMIN",
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
