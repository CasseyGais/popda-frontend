// src/utils/auth-helpers.ts
import { User } from "../context/AuthContext";

// ─── Role hierarchy (tetap dipertahankan) ────────────────

export const ROLE_HIERARCHY = {
  STAFF_LAPANGAN: 1,
  ADMIN: 2,
  SUPERADMIN: 3,
};

export const hasPermission = (userRole: string | null, requiredRole: string): boolean => {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 0;
  return userLevel >= requiredLevel;
};

// ─── Permission helpers (baru) ────────────────────────────

/**
 * Cek apakah user punya permission tertentu.
 * Wildcard '*' = SUPERADMIN, selalu true.
 */
export function can(permissions: string[], permission: string): boolean {
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
}

/**
 * Cek apakah user punya minimal satu dari banyak permission.
 */
export function canAny(permissions: string[], permissionList: string[]): boolean {
  return permissionList.some(p => can(permissions, p));
}

/**
 * Mapping path → permission yang dibutuhkan untuk masuk ke halaman.
 * ProtectedRoute akan pakai ini sebagai fallback jika requiredPermission tidak di-pass.
 * 
 * CATATAN: /dashboard TIDAK ada di sini — dashboard bisa diakses semua user yang login.
 */
export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/atlet-by-sports":     "trx_kontingen_cabor.read",
  "/atlet-by-numbers":    "trx_kontingen_nomor.read",
  "/atlet-by-names":      "trx_pendaftaran_atlet.read",
  "/admin/cabor":         "cabor.read",
  "/admin/nomor":         "nomor.read",
  "/admin/users":         "user.read",
  "/admin/roles":         "role.read",
  "/admin/territories":   "territory.read",
  "/admin/permissions":   "permission.read",
  "/admin/modules":       "permission.read",
  // /identitas-kontingen tidak butuh permission khusus — hanya login
  // /dashboard tidak butuh permission khusus — hanya login
};

// ─── Utility helpers yang sudah ada ──────────────────────

export const canAccessDashboard = (userRole: string | null): boolean => {
  return userRole !== null;
};

export const getWelcomeMessage = (user: User | null, role: string | null): string => {
  if (!user) return "Selamat Datang";
  const roleLabels = {
    SUPERADMIN: "Super Admin",
    ADMIN: "Admin",
    STAFF_LAPANGAN: "Staff Lapangan",
  };
  const roleLabel = roleLabels[role as keyof typeof roleLabels] || "User";
  const location = user.kab_kota ? ` - ${user.kab_kota}` : "";
  return `Selamat Datang, ${roleLabel}${location}`;
};

export const getAvatarUrl = (avatar: string | undefined): string => {
  if (!avatar) return "/images/default-avatar.png";
  if (avatar.startsWith("/")) return `http://localhost:8000${avatar}`;
  if (avatar.startsWith("http")) return avatar;
  return `http://localhost:8000/${avatar}`;
};
