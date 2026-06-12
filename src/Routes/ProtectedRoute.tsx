import { Navigate } from "react-router-dom";
import { useAuthStore } from "../State/auth";
import { ROUTES } from "../Constants/routes";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAdmin     = useAuthStore((state) => state.isAdmin)();

  if (!accessToken) return <Navigate to={ROUTES.LOGIN} replace />;
  if (adminOnly && !isAdmin) return <Navigate to={ROUTES.HOME} replace />;
  return <>{children}</>;
}
