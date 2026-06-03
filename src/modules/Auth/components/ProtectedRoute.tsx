import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { ROUTE_PERMISSIONS } from "../../../utils/auth-helpers";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Permission spesifik yang dibutuhkan. Jika tidak diisi, pakai ROUTE_PERMISSIONS map. */
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const { isAuthenticated, isLoading, can } = useAuth();
  const location = useLocation();

  // Tunggu restore session dari localStorage selesai
  // sebelum memutuskan redirect — hindari flash redirect ke /login
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  // 1. Cek autentikasi
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Cek permission — prop lebih prioritas, fallback ke map
  const permissionToCheck = requiredPermission ?? ROUTE_PERMISSIONS[location.pathname];

  if (permissionToCheck && !can(permissionToCheck)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
