const IS_LOCALHOST =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const key = encodeURIComponent(name) + "=";
  for (const raw of document.cookie.split(";")) {
    const c = raw.trim();
    if (c.startsWith(key)) return decodeURIComponent(c.slice(key.length));
  }
  return null;
}

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === "undefined") return;
  const parts: string[] = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  parts.push(`path=${options.path ?? "/"}`);
  if (options.domain) parts.push(`domain=${options.domain}`);
  if (options.maxAge !== undefined) parts.push(`max-age=${options.maxAge}`);
  if (options.expires) parts.push(`expires=${options.expires.toUTCString()}`);
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  document.cookie = parts.join("; ");
}

export function removeCookie(name: string, path = "/"): void {
  setCookie(name, "", { path, maxAge: 0 });
}

// 30-day lifetime — overwritten on every setAuth call, cleared on logout
const AUTH_MAX_AGE = 60 * 60 * 24 * 30;

function authOptions(): CookieOptions {
  return {
    path: "/",
    maxAge: AUTH_MAX_AGE,
    // On localhost HTTP, Secure would block the cookie entirely — skip it
    secure: !IS_LOCALHOST,
    // Strict prevents the cookie from being sent on cross-site navigations,
    // protecting against CSRF for both local and production environments
    sameSite: "Strict",
  };
}

export const AUTH_COOKIE_KEYS = {
  ACCESS_TOKEN:  "huebox_access_token",
  REFRESH_TOKEN: "huebox_refresh_token",
  USER:          "huebox_user",
  USER_EMAIL:    "huebox_user_email",
  USER_ROLE:     "huebox_user_role",
} as const;

export type AuthCookieKey = typeof AUTH_COOKIE_KEYS[keyof typeof AUTH_COOKIE_KEYS];

export function getAuthCookie(key: AuthCookieKey): string | null {
  return getCookie(key);
}

export function setAuthCookie(key: AuthCookieKey, value: string): void {
  setCookie(key, value, authOptions());
}

export function removeAuthCookie(key: AuthCookieKey): void {
  removeCookie(key);
}

export function clearAllAuthCookies(): void {
  for (const key of Object.values(AUTH_COOKIE_KEYS) as AuthCookieKey[]) {
    removeAuthCookie(key);
  }
}
