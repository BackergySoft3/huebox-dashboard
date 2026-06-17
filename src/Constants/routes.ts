export const ROUTES = {
  LOGIN:          "/login",
  HOME:           "/",
  CONTROL:        "/control",
  PROGRESS:       "/progress",
  PERFORMANCE:    "/performance",
  MY_BOT:         "/my-bot",
  PAYMENTS:       "/payments",
  PAYMENT_RETURN: "/payment/return",
  TRADING:        "/trading",
  LOGS:           "/logs",
  SETTINGS:       "/settings",
  USERS:          "/users",
  ADMIN_BOTS:     "/admin/bots",
  ADMIN_KYC:      "/admin/kyc",
  ADMIN_FINANCE:  "/admin/finance",
  ADMIN_CONFIG:   "/admin/config",
  SYSTEM:         "/system",
  ADMIN_TRANSFER_COIN: "/admin/transfer-coin",
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
