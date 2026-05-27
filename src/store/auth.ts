import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: { email: string } | null;
  setAuth: (accessToken: string | null, refreshToken: string | null, user?: { email: string } | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem("huebox_access_token"),
  refreshToken: localStorage.getItem("huebox_refresh_token"),
  user: localStorage.getItem("huebox_user_email") ? { email: localStorage.getItem("huebox_user_email")! } : null,
  
  setAuth: (accessToken, refreshToken, user = null) => {
    if (accessToken) localStorage.setItem("huebox_access_token", accessToken);
    else localStorage.removeItem("huebox_access_token");

    if (refreshToken) localStorage.setItem("huebox_refresh_token", refreshToken);
    else localStorage.removeItem("huebox_refresh_token");

    if (user?.email) localStorage.setItem("huebox_user_email", user.email);
    else localStorage.removeItem("huebox_user_email");

    set({ accessToken, refreshToken, user });
  },

  logout: () => {
    localStorage.removeItem("huebox_access_token");
    localStorage.removeItem("huebox_refresh_token");
    localStorage.removeItem("huebox_user_email");
    set({ accessToken: null, refreshToken: null, user: null });
  }
}));
