import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import type { AuthContextType } from "../interfaces/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(localStorage.getItem("huebox_access_token"));
  const [refreshToken, setRefreshTokenState] = useState<string | null>(localStorage.getItem("huebox_refresh_token"));

  useEffect(() => {
    if (accessToken) localStorage.setItem("huebox_access_token", accessToken);
    else localStorage.removeItem("huebox_access_token");
    
    if (refreshToken) localStorage.setItem("huebox_refresh_token", refreshToken);
    else localStorage.removeItem("huebox_refresh_token");
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
    <AuthContext.Provider value={{ accessToken, refreshToken, isAuthenticated: !!accessToken, login, logout, setAccessToken }}>
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
