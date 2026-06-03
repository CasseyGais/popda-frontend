import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginApi, LoginPayload, LoginResponse } from "../service";
import AuthPageLayout from "../components/AuthPageLayout";
import { useAuth } from "../../../context/AuthContext";

const REMEMBER_EMAIL_KEY = "remembered_email";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  // Saat halaman dibuka, cek apakah ada email yang tersimpan
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload: LoginPayload = {
      email,
      password,
      remember_me: rememberMe,
    };

    try {
      const response: LoginResponse = await loginApi(payload);

      if (response.success) {
        // Simpan atau hapus email berdasarkan pilihan "Ingat saya"
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }

        const userWithRole = {
          ...response.data.user,
          role: response.data.user.role ?? { name: response.data.role },
        };

        await authLogin(response.data.token, userWithRole, response.data.role);
        navigate("/dashboard");
      } else {
        // Backend return success: false — tampilkan pesan dari backend
        setError(response.error || response.message || "Email atau password salah.");
      }
    } catch (err: any) {
      // Network error atau server error (5xx)
      if (err.message?.includes("terhubung") || err.message?.includes("fetch") || err instanceof TypeError) {
        setError("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || err.message || "Terjadi kesalahan saat login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <div className="flex items-center justify-center w-full h-full p-6 sm:p-8 md:p-10 lg:p-14 xl:p-16 2xl:p-20">
        <div className="mx-auto w-full max-w-[440px]">
          <div className="mb-6 text-center">
            <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Selamat Datang
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Masuk ke akun POPDA 2026 Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-brand-400"
                placeholder="Email Anda"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-brand-400"
                  placeholder="Password Anda"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    /* Eye-off icon */
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.477 10.477A3 3 0 0013.52 13.52M6.343 6.343A9.953 9.953 0 002.458 12C3.732 15.943 7.523 18.75 12 18.75c1.761 0 3.41-.477 4.83-1.308M9.75 4.757A9.956 9.956 0 0112 4.5c4.477 0 8.268 2.557 9.542 6.5a9.978 9.978 0 01-1.965 3.286" />
                    </svg>
                  ) : (
                    /* Eye icon */
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5.25 12 5.25c4.477 0 8.268 2.693 9.542 6.75-1.274 4.057-5.065 6.75-9.542 6.75-4.477 0-8.268-2.693-9.542-6.75z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-brand-400"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Ingat saya
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-brand-400 dark:hover:bg-brand-500"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              POPDA 2026 - Sistem Pendaftaran Olahraga Terpadu
            </p>
          </div>
        </div>
      </div>
    </AuthPageLayout>
  );
}