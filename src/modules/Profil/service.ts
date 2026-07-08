import api from "../../lib/api";

// ─── Types ────────────────────────────────────────────────

export interface ProfilUser {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  avatar: string | null;
  created_at: string;
}

export interface UpdateProfilPayload {
  name?: string;
  email?: string;
}

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  data: {
    avatar: string; // path: "/uploads/avatar/..."
  };
}

// ─── Validasi file avatar (frontend-side) ─────────────────

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Validasi tipe dan ukuran file avatar sebelum kirim ke API.
 * Mengembalikan pesan error, atau null jika valid.
 */
export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "File harus berupa gambar (jpeg, png, webp, gif)";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "Ukuran file maksimal 2 MB";
  }
  return null;
}

// ─── Service ─────────────────────────────────────────────

/**
 * GET /admin/users/:id
 * Ambil data user berdasarkan ID.
 */
export const getProfilUser = (id: number): Promise<ProfilUser> =>
  api.get(`/admin/users/${id}`).then(r => r.data.data ?? r.data);

/**
 * PUT /admin/users/:id
 * Update nama dan/atau email — JSON body.
 * Hanya kirim field yang berubah (partial update).
 */
export const updateProfil = (
  id: number,
  payload: UpdateProfilPayload
): Promise<ProfilUser> =>
  api.put(`/admin/users/${id}`, payload).then(r => r.data.data ?? r.data);

/**
 * PUT /admin/users/:id/avatar
 * Upload file avatar baru — multipart/form-data, field name: "avatar".
 * Menggunakan axios api instance agar interceptor auth tetap jalan.
 * Mengembalikan path avatar baru di response.data.avatar.
 */
export const uploadAvatar = (
  id: number,
  file: File
): Promise<UploadAvatarResponse> => {
  const formData = new FormData();
  formData.append("avatar", file);
  return api
    .put(`/admin/users/${id}/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(r => r.data);
};

/**
 * PUT /admin/users/:id/password
 * Update password — JSON body { password }.
 * Password sudah di-hash SHA-256 sebelum dikirim (dilakukan di komponen).
 */
export const updatePassword = (
  id: number,
  password: string
): Promise<{ success: boolean; message: string }> =>
  api.put(`/admin/users/${id}/password`, { password }).then(r => r.data);

export const profilService = {
  get:            getProfilUser,
  update:         updateProfil,
  uploadAvatar,
  updatePassword,
};
