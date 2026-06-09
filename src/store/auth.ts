import { create } from "zustand";

export type UserRole = "USER" | "ADMIN" | "SUPERADMIN";

interface AuthUser {
  id?: string;
  email: string;
  role?: UserRole;
  status?: string;
  kycStatus?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (
    accessToken: string | null,
    refreshToken: string | null,
    user?: AuthUser | null
  ) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

const parseStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem("huebox_user");
    if (raw) return JSON.parse(raw);
    // Legacy fallback
    const email = localStorage.getItem("huebox_user_email");
    const role = localStorage.getItem("huebox_user_role") as UserRole | null;
    if (email) return { email, role: role ?? "USER" };
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
      // Keep legacy keys in sync
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
    return role === "ADMIN" || role === "SUPERADMIN";
  },

  isSuperAdmin: () => get().user?.role === "SUPERADMIN",
}));
