// src/context/AuthContext.tsx

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

import api from "../lib/api";



export interface User {

  id: number;

  name: string;

  email: string;

  is_active: boolean;

  kab_kota: string;

  avatar?: string;

}



interface AuthContextType {

  user: User | null;

  role: string | null;

  token: string | null;

  isLoading: boolean;

  login: (

    email: string,

    password: string

  ) => Promise<{ success: boolean; error?: string }>;

  logout: () => void;

}



const AuthContext = createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<User | null>(null);

  const [role, setRole] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {

    const storedUser = localStorage.getItem("user");

    const storedToken = localStorage.getItem("token");

    const storedRole = localStorage.getItem("role");



    if (storedUser && storedToken && storedRole) {

      const parsedUser = JSON.parse(storedUser);

      setUser(parsedUser);

      setToken(storedToken);

      setRole(storedRole);

    }



    setIsLoading(false);

  }, []);



  const login = async (email: string, password: string) => {

    try {

      console.log("Attempting login with:", email);

      const response = await api.post("/login", {

        email,

        password,

      });



      console.log("Login response:", response.data);

      const { token, user, role } = response.data;



      localStorage.setItem("token", token);

      localStorage.setItem("user", JSON.stringify(user));

      localStorage.setItem("role", role);



      console.log("Stored in localStorage:", {

        token: token ? "EXISTS" : "NULL",

        user: JSON.stringify(user),

        role

      });



      setUser(user);

      setToken(token);

      setRole(role);



      console.log("State updated:", { user, token, role });



      return { success: true };

    } catch (error: any) {

      console.error("Login error:", error);

      return {

        success: false,

        error: error.response?.data?.error || "Login gagal",

      };

    }

  };



  const logout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    localStorage.removeItem("role");

    setUser(null);

    setToken(null);

    setRole(null);

  };



  return (

    <AuthContext.Provider value={{ user, role, token, isLoading, login, logout }}>

      {children}

    </AuthContext.Provider>

  );

}



export function useAuth() {

  const context = useContext(AuthContext);



  if (!context) {

    throw new Error("useAuth harus digunakan dalam AuthProvider");

  }



  return context;

}