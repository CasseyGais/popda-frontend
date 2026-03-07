// src/components/auth/ResetPasswordForm.tsx
import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";

const OTP_DURATION = 5 * 60; // 5 menit

export default function ResetPasswordForm() {
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [contact, setContact] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Countdown timer
  useEffect(() => {
    let timer: number | undefined;

    if (isOtpSent && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isOtpSent) {
      setIsOtpSent(false);
    }

    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [isOtpSent, timeLeft]);

  // Auto-focus OTP input saat masuk ke step 2
  useEffect(() => {
    if (step === 2 && otpInputRef.current) {
      const focusTimer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(focusTimer);
    }
  }, [step]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendOtp = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulasi API call ke backend (ganti dengan axios/fetch nanti)
    setTimeout(() => {
      setLoading(false);
      setIsOtpSent(true);
      setTimeLeft(OTP_DURATION);
      setStep(2);
    }, 1000);
  };

  const handleResendOtp = () => {
    if (loading || timeLeft > 0) return;

    setLoading(true);
    setError("");

    // Simulasi kirim ulang OTP
    setTimeout(() => {
      setLoading(false);
      setTimeLeft(OTP_DURATION);
    }, 1000);
  };

  const handleVerifyOtp = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError("Kode OTP harus 6 digit.");
      return;
    }

    setLoading(true);
    setError("");

    // Simulasi verifikasi OTP
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 800);
  };

  const handleResetPassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);
    setError("");

    // Simulasi reset password
    setTimeout(() => {
      setLoading(false);
      alert("Password berhasil diubah! Silakan login kembali.");
      navigate("/signin");
    }, 1000);
  };

  // Visual kotak OTP (style mengikuti template)
  const OtpDisplay = () => {
    const digits = otpCode.padEnd(6, " ");
    return (
      <div className="flex justify-center gap-3 my-6">
        {[...digits].map((char, index) => (
          <div
            key={index}
            className={`w-12 h-14 flex items-center justify-center text-2xl font-bold border-b-4 transition-all ${
              char !== " "
                ? "border-brand-500 text-brand-500"
                : "border-gray-300 dark:border-gray-600"
            } ${index === otpCode.length ? "animate-pulse" : ""}`}
          >
            {char !== " " ? char : ""}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          ← Kembali ke Login
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {step === 1 && "Masukkan email atau nomor HP terdaftar untuk verifikasi."}
              {step === 2 && "Masukkan 6 digit kode OTP yang dikirimkan."}
              {step === 3 && "Buat password baru Anda."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-500/50">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <Label>
                  Email atau Nomor HP <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="Contoh: email@domain.com / 08123456789"
                  value={contact}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setContact(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                size="sm"
                disabled={loading || (isOtpSent && timeLeft > 0)}
              >
                {loading ? "Mengirim..." : isOtpSent ? `Kirim Ulang (${formatTime(timeLeft)})` : "Kirim OTP"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <input
                ref={otpInputRef}
                type="tel"
                value={otpCode}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtpCode(val);
                }}
                maxLength={6}
                className="absolute opacity-0 w-1 h-1"
                autoFocus
              />

              <OtpDisplay />

              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Kode berlaku selama <span className="font-bold text-brand-500">{formatTime(timeLeft)}</span>
              </p>

              <Button
                className="w-full"
                size="sm"
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? "Memverifikasi..." : "Verifikasi OTP"}
              </Button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || timeLeft > 0}
                className="w-full text-sm text-brand-500 hover:text-brand-600 disabled:opacity-50"
              >
                Kirim Ulang Kode {timeLeft > 0 ? `(${formatTime(timeLeft)})` : ""}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <Label>
                  Password Baru <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={newPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <Label>
                  Konfirmasi Password <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="password"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button className="w-full" size="sm" disabled={loading}>
                {loading ? "Mengubah..." : "Ubah Password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}