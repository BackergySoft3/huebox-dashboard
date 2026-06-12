import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "./Services/http.service";
import type { AuthContextType } from "./Interfaces/auth";
import {
  getAuthCookie,
  setAuthCookie,
  removeAuthCookie,
  AUTH_COOKIE_KEYS,
} from "./Helpers/cookieAuth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(
    getAuthCookie(AUTH_COOKIE_KEYS.ACCESS_TOKEN)
  );
  const [refreshToken, setRefreshTokenState] = useState<string | null>(
    getAuthCookie(AUTH_COOKIE_KEYS.REFRESH_TOKEN)
  );

  useEffect(() => {
    if (accessToken) setAuthCookie(AUTH_COOKIE_KEYS.ACCESS_TOKEN, accessToken);
    else removeAuthCookie(AUTH_COOKIE_KEYS.ACCESS_TOKEN);

    if (refreshToken) setAuthCookie(AUTH_COOKIE_KEYS.REFRESH_TOKEN, refreshToken);
    else removeAuthCookie(AUTH_COOKIE_KEYS.REFRESH_TOKEN);
  }, [accessToken, refreshToken]);

  const login = (access: string, refresh: string) => {
    setAccessTokenState(access);
    setRefreshTokenState(refresh);
  };

  const logout = () => {
    setAccessTokenState(null);
    setRefreshTokenState(null);
    api.post("/api/auth/logout").catch(() => {});
  };

  const setAccessToken = (token: string) => {
    setAccessTokenState(token);
  };

  return (
    <AuthContext.Provider
      value={{ accessToken, refreshToken, isAuthenticated: !!accessToken, login, logout, setAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
