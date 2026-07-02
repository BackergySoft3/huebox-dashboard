import { UserRole } from "../Enums/UserRole.enum";

export { UserRole };

export interface AuthUser {
  id?: string;
  email: string;
  role?: UserRole;
  status?: string;
  kycStatus?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (access: string, refresh: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
}

export interface AuthState {
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
  refreshUser: () => Promise<void>;
}
