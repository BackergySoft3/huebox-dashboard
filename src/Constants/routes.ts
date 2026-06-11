export const ROUTES = {
  LOGIN:          "/login",
  HOME:           "/",
  CONTROL:        "/control",
  PROGRESS:       "/progress",
  PERFORMANCE:    "/performance",
  PAYMENTS:       "/payments",
  PAYMENT_RETURN: "/payment/return",
  TRADING:        "/trading",
  LOGS:           "/logs",
  USERS:          "/users",
  ADMIN_BOTS:     "/admin/bots",
  ADMIN_KYC:      "/admin/kyc",
  ADMIN_FINANCE:  "/admin/finance",
  ADMIN_CONFIG:   "/admin/config",
  SYSTEM:         "/system",
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
