// src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
  // withCredentials tidak diperlukan — auth pakai Bearer token, bukan cookie
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor untuk handle error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url: string = error.config?.url ?? "";
      const isLoginEndpoint = url === "/login" || url.endsWith("/login");

      if (!isLoginEndpoint) {
        // Token expired atau invalid — redirect ke login
        localStorage.removeItem("token");
        localStorage.removeItem("user_data");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        window.location.href = "/login";
      }
      // Untuk endpoint login: biarkan error diteruskan ke caller
      // agar LoginPage bisa tampilkan "Email atau password salah"
    }
    return Promise.reject(error);
  }
);

export default api;