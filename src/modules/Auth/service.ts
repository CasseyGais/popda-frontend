import api from "../../lib/api";

export interface LoginPayload {
  email: string;
  password: string;
  remember_me?: boolean;
}

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

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
    role: string;
  };
  error?: string;
}

export const login = (data: LoginPayload): Promise<LoginResponse> => {
  return api.post<LoginResponse>("/login", data).then(res => res.data ?? res);
};