import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

export function ProtectedRoute() {
  const checkSession = useAuthStore((s) => s.checkSession);
  const location = useLocation();

  if (!checkSession()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}