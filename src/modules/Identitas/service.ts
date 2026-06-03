import api from "../../lib/api";

/** Helper: prefix path foto dengan base URL
 *  - Di dev: pakai path relatif /uploads/... agar di-proxy Vite (hindari CORS)
 *  - Path yang sudah http tetap dipakai langsung
 */
export function fotoUrl(path: string | null | undefined): string {
  if (!path) return "/images/user/placeholder.jpg";
  if (path.startsWith("http")) return path;
  // path dari backend selalu diawali /uploads/... — biarkan relatif, Vite proxy forward ke backend
  return path;
}

/* =========================================================
   SHARED INTERFACE — dipakai oleh semua endpoint identitas
========================================================= */

export interface Identitas {
  id: number;
  kontingen_id: number;
  kepala_nama: string;
  kepala_jabatan: string;
  kepala_nip: string;
  kepala_telepon: string;
  kepala_foto: string | null;
  pic_nama: string;
  pic_jabatan: string;
  pic_telepon: string;
  pic_foto: string | null;
  alamat: string;
  email_instansi: string;
  phone_instansi: string;
  updated_at: string;
}

export interface IdentitasResponse {
  success: boolean;
  message: string;
  /** data bisa object kosong {} jika belum pernah diisi */
  data: Identitas | Record<string, never>;
}

/* =========================================================
   KONTINGEN (self) — /admin/identitas
   Untuk user ADMIN — otomatis dari JWT token
========================================================= */

/**
 * GET /admin/identitas
 * Response data bisa {} jika belum pernah diisi.
 * Kembalikan null jika kosong agar komponen bisa cek dengan mudah.
 */
export async function getIdentitas(): Promise<{ success: boolean; message: string; data: Identitas | null }> {
  const res = await api.get<IdentitasResponse>("/admin/identitas");
  const body = res.data;
  // Cek apakah data kosong (object tanpa key id)
  const isEmpty = !body.data || !("id" in body.data);
  return {
    success: body.success,
    message: body.message,
    data: isEmpty ? null : (body.data as Identitas),
  };
}

/**
 * PUT /admin/identitas
 * Content-Type: multipart/form-data (karena ada upload foto)
 * Semua field opsional — hanya yang dikirim yang diupdate.
 * Foto yang tidak diupload tidak akan mengubah foto yang sudah ada.
 */
export async function updateIdentitas(formData: FormData): Promise<{ success: boolean; message: string; data: Identitas }> {
  const res = await api.put<IdentitasResponse>("/admin/identitas", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return {
    success: res.data.success,
    message: res.data.message,
    data: res.data.data as Identitas,
  };
}

export const identitasService = {
  get: getIdentitas,
  update: updateIdentitas,
};

/* =========================================================
   KONTINGEN IDENTITAS CRUD — /admin/kontingen-identitas
   Untuk Superadmin — kelola identitas semua kontingen
========================================================= */

export interface KontingenIdentitasListResponse {
  success: boolean;
  message: string;
  data: Identitas[];
}

export interface KontingenIdentitasSingleResponse {
  success: boolean;
  message: string;
  data: Identitas;
}

export interface KontingenIdentitasPayload {
  kontingen_id: number;
  kepala_nama?: string;
  kepala_jabatan?: string;
  kepala_nip?: string;
  kepala_telepon?: string;
  kepala_foto?: string;
  pic_nama?: string;
  pic_jabatan?: string;
  pic_telepon?: string;
  pic_foto?: string;
  alamat?: string;
  email_instansi?: string;
  phone_instansi?: string;
}

export interface FotoPayload {
  foto: string;
}

// GET /admin/kontingen-identitas
export async function getAllKontingenIdentitas(): Promise<KontingenIdentitasListResponse> {
  const res = await api.get("/admin/kontingen-identitas");
  return res.data;
}

// GET /admin/kontingen-identitas/:id
export async function getKontingenIdentitasById(id: number): Promise<KontingenIdentitasSingleResponse> {
  const res = await api.get(`/admin/kontingen-identitas/${id}`);
  return res.data;
}

// GET /admin/kontingen-identitas/kontingen/:kontingen_id
// Backend bisa return single object atau array — handle keduanya
export async function getKontingenIdentitasByKontingenId(
  kontingenId: number
): Promise<{ success: boolean; message: string; data: Identitas | Identitas[] }> {
  const res = await api.get(`/admin/kontingen-identitas/kontingen/${kontingenId}`);
  return res.data;
}

// POST /admin/kontingen-identitas
export async function createKontingenIdentitas(payload: KontingenIdentitasPayload): Promise<KontingenIdentitasSingleResponse> {
  const res = await api.post("/admin/kontingen-identitas", payload);
  return res.data;
}

// PUT /admin/kontingen-identitas/:id
export async function updateKontingenIdentitas(
  id: number,
  payload: Partial<Omit<KontingenIdentitasPayload, "kontingen_id">>
): Promise<KontingenIdentitasSingleResponse> {
  const res = await api.put(`/admin/kontingen-identitas/${id}`, payload);
  return res.data;
}

// DELETE /admin/kontingen-identitas/:id
export async function deleteKontingenIdentitas(id: number): Promise<{ success: boolean; message: string }> {
  const res = await api.delete(`/admin/kontingen-identitas/${id}`);
  return res.data;
}

// PUT /admin/kontingen-identitas/:id/kepala-foto
// Dual-mode: multipart/form-data (file upload) atau JSON { "foto": "/path" }
export async function updateKepalaFoto(
  id: number,
  payload: FotoPayload | FormData
): Promise<{ success: boolean; message: string; foto?: string }> {
  const isFormData = payload instanceof FormData;
  const res = await api.put(
    `/admin/kontingen-identitas/${id}/kepala-foto`,
    payload,
    isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}
  );
  return res.data;
}

// PUT /admin/kontingen-identitas/:id/pic-foto
// Dual-mode: multipart/form-data (file upload) atau JSON { "foto": "/path" }
export async function updatePicFoto(
  id: number,
  payload: FotoPayload | FormData
): Promise<{ success: boolean; message: string; foto?: string }> {
  const isFormData = payload instanceof FormData;
  const res = await api.put(
    `/admin/kontingen-identitas/${id}/pic-foto`,
    payload,
    isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {}
  );
  return res.data;
}

export const kontingenIdentitasService = {
  getAll: getAllKontingenIdentitas,
  getById: getKontingenIdentitasById,
  getByKontingenId: getKontingenIdentitasByKontingenId,
  create: createKontingenIdentitas,
  update: updateKontingenIdentitas,
  delete: deleteKontingenIdentitas,
  updateKepalaFoto,
  updatePicFoto,
};

/* =========================================================
   KONTINGEN CRUD — /admin/kontingen
   Untuk Superadmin — kelola data kontingen semua wilayah
========================================================= */

export type TahapStatus = "DRAFT" | "SUBMITTED";

export interface Kontingen {
  id: number;
  territory_id: number;
  nama_kontingen: string;
  tahap1_status: TahapStatus;
  tahap1_submitted_at: string | null;
  tahap2_status: TahapStatus;
  tahap2_submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KontingenPayload {
  territory_id: number;
  nama_kontingen: string;
  tahap1_status?: TahapStatus;
  tahap2_status?: TahapStatus;
}

// GET /admin/kontingen/:id
export async function getKontingenById(id: number): Promise<{ data: Kontingen }> {
  const res = await api.get(`/admin/kontingen/${id}`);
  return res.data;
}

// GET /admin/kontingen/territory/:territory_id
export async function getKontingenByTerritoryId(territoryId: number): Promise<{ data: Kontingen }> {
  const res = await api.get(`/admin/kontingen/territory/${territoryId}`);
  return res.data;
}

// POST /admin/kontingen
export async function createKontingen(payload: KontingenPayload): Promise<{ message: string; data: Kontingen }> {
  const res = await api.post("/admin/kontingen", payload);
  return res.data;
}

// PUT /admin/kontingen/:id
export async function updateKontingen(
  id: number,
  payload: Partial<KontingenPayload>
): Promise<{ message: string; data: Kontingen }> {
  const res = await api.put(`/admin/kontingen/${id}`, payload);
  return res.data;
}

export const kontingenService = {
  getById: getKontingenById,
  getByTerritoryId: getKontingenByTerritoryId,
  create: createKontingen,
  update: updateKontingen,
};
