import api from "../../lib/api";

const BASE_URL = "http://localhost:8000";
const getToken = () => localStorage.getItem("token") ?? "";

/**
 * Helper: query string untuk territory_id
 * Superadmin wajib kirim ?territory_id=X di semua endpoint
 */
function tq(territoryId?: number): string {
  return territoryId ? `?territory_id=${territoryId}` : "";
}

/** Buat fetch request ke backend dengan auth header */
const fetchJson = async (
  url: string,
  init: RequestInit = {}
): Promise<any> => {
  const r = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${getToken()}` },
    // Jangan set Content-Type untuk FormData — biarkan browser set boundary otomatis
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.success === false)
    throw new Error(data.message || data.error || `Error ${r.status}`);
  return data;
};

// ─── Interfaces ──────────────────────────────────────────

export type PersonStatus = "draft" | "terdaftar" | "terverifikasi" | "ditolak";
export type JenisKelamin = "L" | "P";

// --- Atlet ---

export interface MasterAtlet {
  id: number;
  kontingen_id: number;
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin;
  tanggal_lahir: string;        // YYYY-MM-DD
  tempat_lahir: string | null;
  nisn: string;
  nis: string | null;
  sekolah: string;
  kelas_jurusan: string | null;
  alamat: string | null;
  kabupaten_kota: string;
  no_hp: string | null;
  nama_ortu_wali: string | null;
  status: PersonStatus;
  foto: string | null;
  file_kartu_pelajar: string | null;
  file_akte_kelahiran: string | null;
  file_kk: string | null;
  file_surat_keterangan_sekolah: string | null;
  file_surat_izin_ortu: string | null;
  prestasi_sebelumnya: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface AtletPayload {
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin;
  tanggal_lahir: string;
  tempat_lahir?: string;
  nisn: string;
  nis?: string;
  sekolah: string;
  kelas_jurusan?: string;
  alamat?: string;
  kabupaten_kota: string;
  no_hp?: string;
  nama_ortu_wali?: string;
  prestasi_sebelumnya?: string;
  catatan?: string;
}

// --- Pelatih ---
// Endpoint: /admin/master/pelatih  (bukan /admin/tahap3/pelatih)

export interface MasterPelatih {
  id: number;
  kontingen_id: number;
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin;
  tanggal_lahir: string | null;
  tempat_lahir: string | null;
  nik: string | null;
  sekolah_asal: string | null;
  profesi: string | null;
  jabatan: string | null;
  alamat: string | null;
  kabupaten_kota: string;
  no_hp: string;
  email: string | null;
  nama_istri_suami: string | null;
  status: PersonStatus;
  foto: string | null;
  file_ktp: string | null;
  file_surat_tugas: string | null;
  file_sertifikat_pelatih: string | null;
  prestasi_sebelumnya: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface PelatihPayload {
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin;
  tanggal_lahir?: string;
  tempat_lahir?: string;
  nik?: string;
  sekolah_asal?: string;
  profesi?: string;
  jabatan?: string;
  alamat?: string;
  kabupaten_kota: string;
  no_hp: string;
  email?: string;
  nama_istri_suami?: string;
  prestasi_sebelumnya?: string;
  catatan?: string;
}

// --- Official ---
// Endpoint: /admin/master/official  (bukan /admin/tahap3/official)

export interface MasterOfficial {
  id: number;
  kontingen_id: number;
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin;
  tanggal_lahir: string | null;
  tempat_lahir: string | null;
  nik: string | null;
  sekolah_asal: string | null;
  jabatan: string;
  alamat: string | null;
  kabupaten_kota: string;
  no_hp: string;
  email: string | null;
  status: PersonStatus;
  foto: string | null;
  file_ktp: string | null;
  file_surat_tugas: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfficialPayload {
  nama_lengkap: string;
  jenis_kelamin: JenisKelamin;
  tanggal_lahir?: string;
  tempat_lahir?: string;
  nik?: string;
  sekolah_asal?: string;
  jabatan: string;
  alamat?: string;
  kabupaten_kota: string;
  no_hp: string;
  email?: string;
  catatan?: string;
}

// --- Transaksi ---

export interface TrxAtlet {
  id: number;
  atlet_id: number;
  cabor_id: number;
  nomor_id: number;
  created_at: string;
  updated_at: string;
}

export interface TrxPelatih {
  id: number;
  pelatih_id: number;
  cabor_id: number;
  created_at: string;
  updated_at: string;
}

export interface TrxOfficial {
  id: number;
  official_id: number;
  created_at: string;
  updated_at: string;
}

// --- Response wrappers ---

export interface ListResponse<T> { success: boolean; message?: string; data: T[] }
export interface SingleResponse<T> { success: boolean; message: string; data: T }

// ─── Atlet endpoints (/admin/tahap3/atlet) ────────────────
// Atlet tetap pakai /admin/tahap3/atlet sesuai dokumentasi

/**
 * GET /admin/tahap3/atlet
 * territoryId wajib untuk superadmin.
 */
export const getAtlets = (territoryId?: number): Promise<ListResponse<MasterAtlet>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.get("/admin/tahap3/atlet", { params }).then(r => r.data);
};

export const getAtletById = (id: number): Promise<SingleResponse<MasterAtlet>> =>
  api.get(`/admin/tahap3/atlet/${id}`).then(r => r.data);

/**
 * POST /admin/tahap3/atlet
 * territoryId wajib untuk superadmin — backend resolve kontingen_id dari sini.
 * Jangan kirim kontingen_id di payload.
 */
export const createAtlet = (
  payload: AtletPayload,
  territoryId?: number
): Promise<SingleResponse<MasterAtlet>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.post("/admin/tahap3/atlet", payload, { params }).then(r => r.data);
};

/**
 * PUT /admin/tahap3/atlet/:id
 * Backend validasi kepemilikan — superadmin wajib kirim territory_id.
 */
export const updateAtlet = (
  id: number,
  payload: Partial<AtletPayload>,
  territoryId?: number
): Promise<SingleResponse<MasterAtlet>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.put(`/admin/tahap3/atlet/${id}`, payload, { params }).then(r => r.data);
};

/**
 * DELETE /admin/tahap3/atlet/:id
 * Backend validasi kepemilikan — superadmin wajib kirim territory_id.
 */
export const deleteAtlet = (
  id: number,
  territoryId?: number
): Promise<{ success: boolean; message: string }> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.delete(`/admin/tahap3/atlet/${id}`, { params }).then(r => r.data);
};

/** PUT /admin/tahap3/atlet/:id/foto */
export const uploadFotoAtlet = async (
  id: number,
  file: File
): Promise<{ success: boolean; message: string; path: string }> => {
  const fd = new FormData();
  fd.append("foto", file);
  return fetchJson(`${BASE_URL}/admin/tahap3/atlet/${id}/foto`, {
    method: "PUT",
    body: fd,
  });
};

/** PUT /admin/tahap3/atlet/:id/file/:kolom */
export const uploadFileAtlet = async (
  id: number,
  kolom:
    | "file_kartu_pelajar"
    | "file_akte_kelahiran"
    | "file_kk"
    | "file_surat_keterangan_sekolah"
    | "file_surat_izin_ortu",
  file: File
): Promise<{ success: boolean; message: string; path: string }> => {
  const fd = new FormData();
  fd.append("file", file);
  return fetchJson(`${BASE_URL}/admin/tahap3/atlet/${id}/file/${kolom}`, {
    method: "PUT",
    body: fd,
  });
};

// ─── Pelatih endpoints (/admin/master/pelatih) ───────────
// Sesuai TAHAP3_DOCUMENTATION.md — pakai /admin/master/pelatih

/**
 * GET /admin/master/pelatih
 * territoryId wajib untuk superadmin.
 */
export const getPelatihs = (territoryId?: number): Promise<ListResponse<MasterPelatih>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.get("/admin/master/pelatih", { params }).then(r => r.data);
};

export const getPelatihById = (id: number): Promise<SingleResponse<MasterPelatih>> =>
  api.get(`/admin/master/pelatih/${id}`).then(r => r.data);

/**
 * POST /admin/master/pelatih
 * Jangan kirim kontingen_id di payload — diisi otomatis dari JWT/territory.
 */
export const createPelatih = (
  payload: PelatihPayload,
  territoryId?: number
): Promise<SingleResponse<MasterPelatih>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.post("/admin/master/pelatih", payload, { params }).then(r => r.data);
};

/**
 * PUT /admin/master/pelatih/:id
 * Partial update. Backend validasi kepemilikan — superadmin wajib kirim territory_id.
 */
export const updatePelatih = (
  id: number,
  payload: Partial<PelatihPayload>,
  territoryId?: number
): Promise<SingleResponse<MasterPelatih>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.put(`/admin/master/pelatih/${id}`, payload, { params }).then(r => r.data);
};

/**
 * DELETE /admin/master/pelatih/:id
 * Cascade hapus semua trx_pendaftaran_pelatih terkait.
 * Backend validasi kepemilikan — superadmin wajib kirim territory_id.
 */
export const deletePelatih = (
  id: number,
  territoryId?: number
): Promise<{ success: boolean; message: string }> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.delete(`/admin/master/pelatih/${id}`, { params }).then(r => r.data);
};

/**
 * PUT /admin/master/pelatih/:id/foto
 * Upload foto via multipart/form-data, field name: foto
 */
export const uploadFotoPelatih = async (
  id: number,
  file: File
): Promise<{ success: boolean; message: string; path: string }> => {
  const fd = new FormData();
  fd.append("foto", file);
  return fetchJson(`${BASE_URL}/admin/master/pelatih/${id}/foto`, {
    method: "PUT",
    body: fd,
  });
};

/**
 * PUT /admin/master/pelatih/:id/file/:kolom
 * Upload dokumen via multipart/form-data, field name: file
 * Kolom valid: file_ktp | file_surat_tugas | file_sertifikat_pelatih
 */
export const uploadFilePelatih = async (
  id: number,
  kolom: "file_ktp" | "file_surat_tugas" | "file_sertifikat_pelatih",
  file: File
): Promise<{ success: boolean; message: string; path: string }> => {
  const fd = new FormData();
  fd.append("file", file);
  return fetchJson(`${BASE_URL}/admin/master/pelatih/${id}/file/${kolom}`, {
    method: "PUT",
    body: fd,
  });
};

// ─── Pelatih Transaksi (/admin/master/pelatih/trx) ───────
// Sesuai TAHAP3_DOCUMENTATION.md — pakai /admin/master/pelatih/trx

/**
 * GET /admin/master/pelatih/trx
 * Ambil semua trx pendaftaran pelatih milik kontingen.
 */
export const getTrxPelatihs = (territoryId?: number): Promise<ListResponse<TrxPelatih>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.get("/admin/master/pelatih/trx", { params }).then(r => r.data);
};

/**
 * POST /admin/master/pelatih/trx
 * Daftarkan pelatih ke cabor tertentu.
 * Backend validasi pelatih_id milik kontingen yang request.
 */
export const daftarPelatih = (
  pelatih_id: number,
  cabor_id: number,
  territoryId?: number
): Promise<SingleResponse<TrxPelatih>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.post("/admin/master/pelatih/trx", { pelatih_id, cabor_id }, { params }).then(r => r.data);
};

/** DELETE /admin/master/pelatih/trx/:id — batalkan pendaftaran pelatih dari cabor */
export const batalDaftarPelatih = (
  trxId: number,
  territoryId?: number
): Promise<{ success: boolean; message: string }> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.delete(`/admin/master/pelatih/trx/${trxId}`, { params }).then(r => r.data);
};

// ─── Official endpoints (/admin/master/official) ─────────
// Sesuai TAHAP3_DOCUMENTATION.md — pakai /admin/master/official

/**
 * GET /admin/master/official
 * territoryId wajib untuk superadmin.
 */
export const getOfficials = (territoryId?: number): Promise<ListResponse<MasterOfficial>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.get("/admin/master/official", { params }).then(r => r.data);
};

export const getOfficialById = (id: number): Promise<SingleResponse<MasterOfficial>> =>
  api.get(`/admin/master/official/${id}`).then(r => r.data);

/**
 * POST /admin/master/official
 * Jangan kirim kontingen_id di payload — diisi otomatis dari JWT/territory.
 */
export const createOfficial = (
  payload: OfficialPayload,
  territoryId?: number
): Promise<SingleResponse<MasterOfficial>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.post("/admin/master/official", payload, { params }).then(r => r.data);
};

/**
 * PUT /admin/master/official/:id
 * Partial update. Backend validasi kepemilikan — superadmin wajib kirim territory_id.
 */
export const updateOfficial = (
  id: number,
  payload: Partial<OfficialPayload>,
  territoryId?: number
): Promise<SingleResponse<MasterOfficial>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.put(`/admin/master/official/${id}`, payload, { params }).then(r => r.data);
};

/**
 * DELETE /admin/master/official/:id
 * Cascade hapus semua trx_pendaftaran_official terkait.
 * Backend validasi kepemilikan — superadmin wajib kirim territory_id.
 */
export const deleteOfficial = (
  id: number,
  territoryId?: number
): Promise<{ success: boolean; message: string }> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.delete(`/admin/master/official/${id}`, { params }).then(r => r.data);
};

/**
 * PUT /admin/master/official/:id/foto
 * Upload foto via multipart/form-data, field name: foto
 */
export const uploadFotoOfficial = async (
  id: number,
  file: File
): Promise<{ success: boolean; message: string; path: string }> => {
  const fd = new FormData();
  fd.append("foto", file);
  return fetchJson(`${BASE_URL}/admin/master/official/${id}/foto`, {
    method: "PUT",
    body: fd,
  });
};

/**
 * PUT /admin/master/official/:id/file/:kolom
 * Upload dokumen via multipart/form-data, field name: file
 * Kolom valid: file_ktp | file_surat_tugas
 */
export const uploadFileOfficial = async (
  id: number,
  kolom: "file_ktp" | "file_surat_tugas",
  file: File
): Promise<{ success: boolean; message: string; path: string }> => {
  const fd = new FormData();
  fd.append("file", file);
  return fetchJson(`${BASE_URL}/admin/master/official/${id}/file/${kolom}`, {
    method: "PUT",
    body: fd,
  });
};

// ─── Official Transaksi (/admin/master/official/trx) ─────
// Sesuai TAHAP3_DOCUMENTATION.md — pakai /admin/master/official/trx

/**
 * GET /admin/master/official/trx
 * Ambil semua trx pendaftaran official milik kontingen.
 */
export const getTrxOfficials = (territoryId?: number): Promise<ListResponse<TrxOfficial>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.get("/admin/master/official/trx", { params }).then(r => r.data);
};

/**
 * POST /admin/master/official/trx
 * Daftarkan official (tanpa cabor — berlaku untuk seluruh kontingen).
 * Backend validasi official_id milik kontingen yang request.
 */
export const daftarOfficial = (
  official_id: number,
  territoryId?: number
): Promise<SingleResponse<TrxOfficial>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.post("/admin/master/official/trx", { official_id }, { params }).then(r => r.data);
};

/** DELETE /admin/master/official/trx/:id — batalkan pendaftaran official */
export const batalDaftarOfficial = (
  trxId: number,
  territoryId?: number
): Promise<{ success: boolean; message: string }> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.delete(`/admin/master/official/trx/${trxId}`, { params }).then(r => r.data);
};

// ─── Atlet Transaksi (/admin/tahap3/trx/atlet) ───────────
// Atlet trx tetap pakai /admin/tahap3/trx/atlet

/**
 * POST /admin/tahap3/trx/atlet
 * Daftarkan atlet ke cabor + nomor.
 * territoryId wajib untuk superadmin.
 */
export const daftarAtlet = (
  atlet_id: number,
  cabor_id: number,
  nomor_id: number,
  territoryId?: number
): Promise<SingleResponse<TrxAtlet>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.post("/admin/tahap3/trx/atlet", { atlet_id, cabor_id, nomor_id }, { params }).then(r => r.data);
};

/**
 * DELETE /admin/tahap3/trx/atlet/:id
 * territoryId wajib untuk superadmin.
 */
export const batalDaftarAtlet = (
  trxId: number,
  territoryId?: number
): Promise<{ success: boolean; message: string }> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.delete(`/admin/tahap3/trx/atlet/${trxId}`, { params }).then(r => r.data);
};

// ─── Tahap 3 Status & Submit ──────────────────────────────

export type Tahap3Status = "DRAFT" | "SUBMITTED";

/**
 * GET /admin/tahap3 — overview endpoint.
 * Dipakai untuk ambil tahap3_status dan semua trx.
 * territoryId wajib untuk superadmin.
 *
 * Response structure: { success, data: { tahap3_status, tahap3_submitted_at, ... } }
 */
export const getTahap3Status = async (territoryId?: number): Promise<{
  tahap3_status: Tahap3Status;
  tahap3_submitted_at: string | null;
  tahap3_validasi_status: "PENDING" | "VALID" | "REVISI" | null;
  tahap3_validasi_catatan: string | null;
}> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  const res = await api.get("/admin/tahap3", { params });
  const d = res.data?.data;
  return {
    tahap3_status:            (d?.tahap3_status ?? "DRAFT") as Tahap3Status,
    tahap3_submitted_at:      d?.tahap3_submitted_at       ?? null,
    tahap3_validasi_status:   d?.tahap3_validasi_status    ?? null,
    tahap3_validasi_catatan:  d?.tahap3_validasi_catatan   ?? null,
  };
};

/**
 * POST /admin/tahap3/submit
 * Bulk insert trx pelatih + official + update status ke SUBMITTED.
 * territoryId wajib untuk superadmin.
 */
export const submitTahap3 = async (
  territoryId?: number
): Promise<{ success: boolean; message: string }> => {
  const url = `${BASE_URL}/admin/tahap3/submit${tq(territoryId)}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.success === false) throw new Error(data.message || data.error || `Error ${r.status}`);
  return data;
};
