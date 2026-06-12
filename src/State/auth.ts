import { create } from "zustand";
import { UserRole } from "../Enums/UserRole.enum";
import type { AuthUser, AuthState } from "../Interfaces/auth";
import {
  getAuthCookie,
  setAuthCookie,
  removeAuthCookie,
  clearAllAuthCookies,
  AUTH_COOKIE_KEYS,
} from "../Helpers/cookieAuth";

export { UserRole };
export type { AuthUser, AuthState };

const parseStoredUser = (): AuthUser | null => {
  try {
    const raw = getAuthCookie(AUTH_COOKIE_KEYS.USER);
    if (raw) return JSON.parse(raw) as AuthUser;
    const email = getAuthCookie(AUTH_COOKIE_KEYS.USER_EMAIL);
    const role = getAuthCookie(AUTH_COOKIE_KEYS.USER_ROLE) as UserRole | null;
    if (email) return { email, role: role ?? UserRole.User };
  } catch {}
  return null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: getAuthCookie(AUTH_COOKIE_KEYS.ACCESS_TOKEN),
  refreshToken: getAuthCookie(AUTH_COOKIE_KEYS.REFRESH_TOKEN),
  user: parseStoredUser(),

  setAuth: (accessToken, refreshToken, user = null) => {
    if (accessToken) setAuthCookie(AUTH_COOKIE_KEYS.ACCESS_TOKEN, accessToken);
    else removeAuthCookie(AUTH_COOKIE_KEYS.ACCESS_TOKEN);

    if (refreshToken) setAuthCookie(AUTH_COOKIE_KEYS.REFRESH_TOKEN, refreshToken);
    else removeAuthCookie(AUTH_COOKIE_KEYS.REFRESH_TOKEN);

    if (user) {
      setAuthCookie(AUTH_COOKIE_KEYS.USER, JSON.stringify(user));
      if (user.email) setAuthCookie(AUTH_COOKIE_KEYS.USER_EMAIL, user.email);
      if (user.role)  setAuthCookie(AUTH_COOKIE_KEYS.USER_ROLE, user.role);
    } else {
      removeAuthCookie(AUTH_COOKIE_KEYS.USER);
      removeAuthCookie(AUTH_COOKIE_KEYS.USER_EMAIL);
      removeAuthCookie(AUTH_COOKIE_KEYS.USER_ROLE);
    }

    set({ accessToken, refreshToken, user });
  },

  logout: () => {
    clearAllAuthCookies();
    set({ accessToken: null, refreshToken: null, user: null });
  },

  isAdmin: () => {
    const role = get().user?.role;
    return role === UserRole.Admin || role === UserRole.SuperAdmin;
  },

  isSuperAdmin: () => get().user?.role === UserRole.SuperAdmin,
}));
