// src/routes/ProtectedRoute.tsx
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!user || !token) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  const userRole = role?.toLowerCase() || "";

  if (allowedRoles && allowedRoles.length > 0) {
    const allowedLower = allowedRoles.map(r => r.toLowerCase());
    if (!allowedLower.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;