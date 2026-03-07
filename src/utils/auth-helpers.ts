// src/utils/auth-helpers.ts
import { User } from "../context/AuthContext";

export const hasPermission = (userRole: string | null, requiredRole: string): boolean => {
  if (!userRole) return false;
  
  const roleHierarchy = {
    'SUPERADMIN': 3,
    'ADMIN': 2,
    'STAFF_LAPANGAN': 1
  };
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  
  return userLevel >= requiredLevel;
};

export const canAccessDashboard = (userRole: string | null): boolean => {
  return userRole !== null;
};

export const getWelcomeMessage = (user: User | null, role: string | null): string => {
  if (!user) return "Selamat Datang";
  
  const roleLabels = {
    'SUPERADMIN': 'Super Admin',
    'ADMIN': 'Admin',
    'STAFF_LAPANGAN': 'Staff Lapangan'
  };
  
  const roleLabel = roleLabels[role as keyof typeof roleLabels] || 'User';
  const location = user.kab_kota ? ` - ${user.kab_kota}` : '';
  
  return `Selamat Datang, ${roleLabel}${location}`;
};

export const getAvatarUrl = (avatar: string | undefined): string => {
  if (!avatar) return '/images/default-avatar.png';
  if (avatar.startsWith('/')) return `http://localhost:8000${avatar}`;
  if (avatar.startsWith('http')) return avatar;
  return `http://localhost:8000/${avatar}`;
};
