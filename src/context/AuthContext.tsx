import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

export interface Territory {
  id: number;
  name: string;
  type: "PROVINSI" | "KABUPATEN" | "KOTA";
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  avatar: string | null;
  role?: {
    name: string;
  };
  kab_kota?: string;
  territories?: Territory[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: string[];
  isLoading: boolean;
  login: (token: string, user: User, role?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Fetch permissions dari backend setelah login */
async function fetchPermissions(
  token: string,
  userId: number,
  roleName: string
): Promise<string[]> {
  // SUPERADMIN bypass — wildcard
  const name = roleName.toLowerCase().replace(/[_\s]/g, "");
  if (name === "superadmin") return ["*"];

  try {
    // 1. Ambil role IDs user
    const rolesRes = await fetch(
      `http://localhost:8000/admin/users/${userId}/roles`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const rolesData = await rolesRes.json();
    const roleIds: number[] = Array.isArray(rolesData.data) ? rolesData.data : [];
    if (roleIds.length === 0) return [];

    // 2. Ambil permission dari role pertama
    const permRes = await fetch(
      `http://localhost:8000/admin/permissions/role/${roleIds[0]}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const permData = await permRes.json();
    const perms: string[] = Array.isArray(permData.data)
      ? permData.data.map((p: { name: string }) => p.name)
      : [];
    return perms;
  } catch (err) {
    console.warn("[AuthContext] Gagal fetch permissions:", err);
    return [];
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]             = useState<User | null>(null);
  const [token, setToken]           = useState<string | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [permissions, setPermissions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("permissions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Restore session dari localStorage
  useEffect(() => {
    const storedToken       = localStorage.getItem("token");
    const storedUser        = localStorage.getItem("user_data");
    const storedPermissions = localStorage.getItem("permissions");

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user_data");
      }
      if (storedPermissions) {
        try {
          setPermissions(JSON.parse(storedPermissions));
        } catch {
          setPermissions([]);
        }
      }
    } else {
      setPermissions([]);
      localStorage.removeItem("permissions");
    }
    // Selesai restore — aman untuk render route
    setIsLoading(false);
  }, []);

  /**
   * login() dipanggil dari LoginPage setelah berhasil dapat token.
   * Otomatis fetch permissions setelah set token.
   * role param dari response.data.role (string) dipakai untuk deteksi superadmin.
   */
  const login = async (newToken: string, newUser: User, role?: string): Promise<void> => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user_data", JSON.stringify(newUser));

    // Resolve role name — bisa dari arg, atau dari newUser.role.name
    const roleName = role ?? newUser.role?.name ?? "";

    const perms = await fetchPermissions(newToken, newUser.id, roleName);
    localStorage.setItem("permissions", JSON.stringify(perms));
    setPermissions(perms);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setPermissions([]);
    localStorage.removeItem("token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("permissions");
  };

  /** Cek satu permission. Wildcard '*' (SUPERADMIN) selalu true. */
  const can = (permission: string): boolean => {
    if (permissions.includes("*")) return true;
    return permissions.includes(permission);
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ user, token, permissions, isLoading, login, logout, isAuthenticated, can }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
