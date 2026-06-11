export const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export const AUTH_ENDPOINTS = {
  LOGIN:          "/api/auth/login",
  LOGOUT:         "/api/auth/logout",
  REFRESH:        "/api/auth/token/refresh",
  OTP_SEND:       "/api/auth/otp/send",
  OTP_VERIFY:     "/api/auth/otp/verify",
} as const;

export const USER_ENDPOINTS = {
  LIST:           "/api/admin/users",
  DETAIL:         (id: string) => `/api/admin/users/${id}`,
  SESSIONS:       (id: string) => `/api/admin/users/${id}/sessions`,
  STATUS_HISTORY: (id: string) => `/api/admin/users/${id}/status-history`,
} as const;

export const BOT_ENDPOINTS = {
  STATUS:    "/api/bot/status",
  PAUSE:     "/api/bot/pause",
  RESUME:    "/api/bot/resume",
  SELECT:    "/api/bot/select",
  FILTER:    "/api/bot/filter",
  ADMIN_LIST: "/api/admin/bots",
} as const;

export const KYC_ENDPOINTS = {
  QUEUE:   "/api/admin/kyc/queue",
  STATS:   "/api/admin/kyc/stats",
  DETAIL:  (id: string) => `/api/admin/kyc/${id}`,
  APPROVE: (id: string) => `/api/admin/kyc/${id}/approve`,
  REJECT:  (id: string) => `/api/admin/kyc/${id}/reject`,
} as const;

export const WALLET_ENDPOINTS = {
  BALANCE:  "/api/wallet/balance",
  HISTORY:  "/api/wallet/transactions",
  ORDER:    "/api/payments/create-order",
  WITHDRAW: "/api/wallet/withdraw",
  SEND:     "/api/wallet/send",
} as const;
