import { apiClient } from "../../shared/ApiClient";

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

// Type definition sesuai Postman collection response
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
  return apiClient<LoginResponse>("/login", {
    method: "POST",
    body: data,
  });
};