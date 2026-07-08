/**
 * EditProfilModal
 * Modal edit profil user — nama, email, password, dan foto avatar.
 *
 * Sesuai FEATURE_PROFIL_AVATAR_FRONTEND.md:
 * - Update nama/email  → PUT /admin/users/:id          (JSON)
 * - Upload avatar      → PUT /admin/users/:id/avatar   (multipart/form-data)
 * - Preview avatar     → URL.createObjectURL (bukan FileReader)
 * - Cleanup           → URL.revokeObjectURL setelah upload selesai
 * - Validasi file      → tipe & ukuran sebelum kirim ke API
 */
import { useState, useEffect, useRef } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import {
  profilService,
  validateAvatarFile,
  type ProfilUser,
  type UpdateProfilPayload,
} from "../service";
import { getAvatarUrl } from "../../../utils/auth-helpers";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: ProfilUser;
  onSuccess: (updated: ProfilUser) => void;
}

type Tab = "profil" | "password";

export default function EditProfilModal({ isOpen, onClose, user, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("profil");

  // Profil fields
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");

  // Password fields
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  // Avatar — pakai objectURL untuk preview (lebih efisien dari FileReader)
  const [avatarFile,       setAvatarFile]       = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feedback state
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  // ── Reset state saat modal dibuka ──────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setName(user.name);
    setEmail(user.email);
    setNewPassword("");
    setConfirmPassword("");
    setAvatarFile(null);
    // Bersihkan objectURL lama sebelum reset
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarPreviewUrl(null);
    setError("");
    setSuccess("");
    setActiveTab("profil");
  }, [isOpen, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup objectURL saat komponen unmount ────────────
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  // ── Handle pilih file avatar ───────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe dan ukuran di frontend sebelum hit API
    const validationError = validateAvatarFile(file);
    if (validationError) {
      setError(validationError);
      // Reset input agar user bisa pilih file lain
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Bersihkan objectURL lama
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);

    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setError("");
  };

  // ── Simpan profil (nama + email) ± upload avatar ───────
  const handleSaveProfil = async () => {
    if (!name.trim())  { setError("Nama tidak boleh kosong");  return; }
    if (!email.trim()) { setError("Email tidak boleh kosong"); return; }

    const nameChanged  = name.trim()  !== user.name;
    const emailChanged = email.trim() !== user.email;

    if (!nameChanged && !emailChanged && !avatarFile) {
      setError("Tidak ada perubahan yang disimpan.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      let updated: ProfilUser = user;

      // 1. Update nama/email — hanya jika ada perubahan (sequential, bukan paralel)
      if (nameChanged || emailChanged) {
        const payload: UpdateProfilPayload = {};
        if (nameChanged)  payload.name  = name.trim();
        if (emailChanged) payload.email = email.trim();
        updated = await profilService.update(user.id, payload);
      }

      // 2. Upload avatar — hanya jika user memilih file baru
      if (avatarFile) {
        const res = await profilService.uploadAvatar(user.id, avatarFile);
        // Ambil path avatar baru dari response — tidak perlu refetch penuh
        const newAvatarPath = res.data?.avatar ?? null;
        updated = { ...updated, avatar: newAvatarPath };

        // Cleanup objectURL setelah upload berhasil
        URL.revokeObjectURL(avatarPreviewUrl!);
        setAvatarPreviewUrl(null);
        setAvatarFile(null);
      }

      setSuccess("Profil berhasil diperbarui");
      onSuccess(updated);
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message ?? "Gagal memperbarui profil");
    } finally {
      setLoading(false);
    }
  };

  // ── Simpan password baru ───────────────────────────────
  const handleSavePassword = async () => {
    if (!newPassword)                          { setError("Password baru tidak boleh kosong"); return; }
    if (newPassword.length < 6)                { setError("Password minimal 6 karakter"); return; }
    if (newPassword !== confirmPassword)       { setError("Konfirmasi password tidak cocok"); return; }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await profilService.updatePassword(user.id, newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password berhasil diubah");
    } catch (e: any) {
      setError(e.response?.data?.message ?? e.message ?? "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  };

  // Avatar yang ditampilkan: preview lokal > avatar dari server > null (inisial)
  const currentAvatarSrc = avatarPreviewUrl ?? (user.avatar ? getAvatarUrl(user.avatar) : null);
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] w-full m-4">
      <div className="no-scrollbar relative w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 p-6 lg:p-8">

        {/* Header */}
        <div className="mb-5 pr-8">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white">Edit Profil</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Perbarui informasi akun Anda
          </p>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {currentAvatarSrc ? (
              <img
                src={currentAvatarSrc}
                alt={name}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-brand-400">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-500 hover:bg-brand-600 text-white rounded-full flex items-center justify-center shadow transition-colors"
              title="Ganti foto"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>

          {/* Input file — hidden, dipicu oleh tombol pensil */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />

          {avatarFile ? (
            <p className="mt-2 text-xs text-brand-500 font-medium">{avatarFile.name}</p>
          ) : (
            <p className="mt-2 text-xs text-gray-400">Klik ikon pensil untuk ganti foto</p>
          )}
          <p className="text-xs text-gray-400">Format: JPG, PNG, WEBP, GIF · Maks 2 MB</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-5">
          {(["profil", "password"] as Tab[]).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => { setActiveTab(tab); setError(""); setSuccess(""); }}
              className={[
                "px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors",
                activeTab === tab
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400",
              ].join(" ")}
            >
              {tab === "profil" ? "Data Profil" : "Ubah Password"}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 text-sm text-green-700 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Tab: Data Profil */}
        {activeTab === "profil" && (
          <div className="space-y-4">
            <div>
              <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nama lengkap"
              />
            </div>
            <div>
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@popda.id"
              />
            </div>
            <div>
              <Label>Status Akun</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                  user.is_active
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {user.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </p>
            </div>
            <div>
              <Label>Terdaftar Sejak</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {new Date(user.created_at).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
        )}

        {/* Tab: Ubah Password */}
        {activeTab === "password" && (
          <div className="space-y-4">
            <div>
              <Label>Password Baru <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(p => !p)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  <EyeToggleIcon show={showNew} />
                </button>
              </div>
            </div>
            <div>
              <Label>Konfirmasi Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(p => !p)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  <EyeToggleIcon show={showConfirm} />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Setelah password diubah, gunakan password baru untuk login berikutnya.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button
            size="sm"
            onClick={activeTab === "profil" ? handleSaveProfil : handleSavePassword}
            disabled={loading}
            className="bg-brand-500 hover:bg-brand-600 text-white"
          >
            {loading
              ? "Menyimpan..."
              : activeTab === "profil"
                ? "Simpan Profil"
                : "Ubah Password"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Sub-komponen kecil ────────────────────────────────────

function EyeToggleIcon({ show }: { show: boolean }) {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {show ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 3l18 18M10.477 10.477A3 3 0 0013.52 13.52M6.343 6.343A9.953 9.953 0 002.458 12C3.732 15.943 7.523 18.75 12 18.75c1.761 0 3.41-.477 4.83-1.308M9.75 4.757A9.956 9.956 0 0112 4.5c4.477 0 8.268 2.557 9.542 6.5a9.978 9.978 0 01-1.965 3.286" />
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M2.458 12C3.732 7.943 7.523 5.25 12 5.25c4.477 0 8.268 2.693 9.542 6.75-1.274 4.057-5.065 6.75-9.542 6.75-4.477 0-8.268-2.693-9.542-6.75z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </>
      )}
    </svg>
  );
}
