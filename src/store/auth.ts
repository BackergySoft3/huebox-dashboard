import { create } from "zustand";
import { UserRole } from "../enums/UserRole.enum";
import type { AuthUser, AuthState } from "../interfaces/auth";

export { UserRole };
export type { AuthUser, AuthState };

const parseStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem("huebox_user");
    if (raw) return JSON.parse(raw);
    // Legacy fallback
    const email = localStorage.getItem("huebox_user_email");
    const role = localStorage.getItem("huebox_user_role") as UserRole | null;
    if (email) return { email, role: role ?? UserRole.User };
  } catch {}
  return null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: localStorage.getItem("huebox_access_token"),
  refreshToken: localStorage.getItem("huebox_refresh_token"),
  user: parseStoredUser(),

  setAuth: (accessToken, refreshToken, user = null) => {
    if (accessToken) localStorage.setItem("huebox_access_token", accessToken);
    else localStorage.removeItem("huebox_access_token");

    if (refreshToken) localStorage.setItem("huebox_refresh_token", refreshToken);
    else localStorage.removeItem("huebox_refresh_token");

    if (user) {
      localStorage.setItem("huebox_user", JSON.stringify(user));
      if (user.email) localStorage.setItem("huebox_user_email", user.email);
      if (user.role) localStorage.setItem("huebox_user_role", user.role);
    } else {
      localStorage.removeItem("huebox_user");
      localStorage.removeItem("huebox_user_email");
      localStorage.removeItem("huebox_user_role");
    }

    set({ accessToken, refreshToken, user });
  },

  logout: () => {
    localStorage.removeItem("huebox_access_token");
    localStorage.removeItem("huebox_refresh_token");
    localStorage.removeItem("huebox_user");
    localStorage.removeItem("huebox_user_email");
    localStorage.removeItem("huebox_user_role");
    set({ accessToken: null, refreshToken: null, user: null });
  },

  isAdmin: () => {
    const role = get().user?.role;
    return role === UserRole.Admin || role === UserRole.SuperAdmin;
  },

  isSuperAdmin: () => get().user?.role === UserRole.SuperAdmin,
}));
