import api from "../../lib/api";

const BASE_URL = "http://localhost:8000";
const getToken = () => localStorage.getItem("token") ?? "";

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

// ─── Atlet endpoints ──────────────────────────────────────

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
 */
export const createAtlet = (
  payload: AtletPayload,
  territoryId?: number
): Promise<SingleResponse<MasterAtlet>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.post("/admin/tahap3/atlet", payload, { params }).then(r => r.data);
};

/** PUT /admin/tahap3/atlet/:id — tidak perlu territory_id */
export const updateAtlet = (
  id: number,
  payload: Partial<AtletPayload>
): Promise<SingleResponse<MasterAtlet>> =>
  api.put(`/admin/tahap3/atlet/${id}`, payload).then(r => r.data);

/** DELETE /admin/tahap3/atlet/:id — hard delete, tidak perlu territory_id */
export const deleteAtlet = (id: number): Promise<{ success: boolean; message: string }> =>
  api.delete(`/admin/tahap3/atlet/${id}`).then(r => r.data);

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

// ─── Pelatih endpoints ────────────────────────────────────

export const getPelatihs = (territoryId?: number): Promise<ListResponse<MasterPelatih>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.get("/admin/tahap3/pelatih", { params }).then(r => r.data);
};

export const getPelatihById = (id: number): Promise<SingleResponse<MasterPelatih>> =>
  api.get(`/admin/tahap3/pelatih/${id}`).then(r => r.data);

export const createPelatih = (
  payload: PelatihPayload,
  territoryId?: number
): Promise<SingleResponse<MasterPelatih>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.post("/admin/tahap3/pelatih", payload, { params }).then(r => r.data);
};

export const updatePelatih = (
  id: number,
  payload: Partial<PelatihPayload>
): Promise<SingleResponse<MasterPelatih>> =>
  api.put(`/admin/tahap3/pelatih/${id}`, payload).then(r => r.data);

export const deletePelatih = (id: number): Promise<{ success: boolean; message: string }> =>
  api.delete(`/admin/tahap3/pelatih/${id}`).then(r => r.data);

/** PUT /admin/tahap3/pelatih/:id/file/:kolom — termasuk foto */
export const uploadFilePelatih = async (
  id: number,
  kolom: "foto" | "file_ktp" | "file_surat_tugas" | "file_sertifikat_pelatih",
  file: File
): Promise<{ success: boolean; message: string; path: string }> => {
  const fd = new FormData();
  fd.append("file", file);
  return fetchJson(`${BASE_URL}/admin/tahap3/pelatih/${id}/file/${kolom}`, {
    method: "PUT",
    body: fd,
  });
};

// ─── Official endpoints ───────────────────────────────────

export const getOfficials = (territoryId?: number): Promise<ListResponse<MasterOfficial>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.get("/admin/tahap3/official", { params }).then(r => r.data);
};

export const getOfficialById = (id: number): Promise<SingleResponse<MasterOfficial>> =>
  api.get(`/admin/tahap3/official/${id}`).then(r => r.data);

export const createOfficial = (
  payload: OfficialPayload,
  territoryId?: number
): Promise<SingleResponse<MasterOfficial>> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.post("/admin/tahap3/official", payload, { params }).then(r => r.data);
};

export const updateOfficial = (
  id: number,
  payload: Partial<OfficialPayload>
): Promise<SingleResponse<MasterOfficial>> =>
  api.put(`/admin/tahap3/official/${id}`, payload).then(r => r.data);

export const deleteOfficial = (id: number): Promise<{ success: boolean; message: string }> =>
  api.delete(`/admin/tahap3/official/${id}`).then(r => r.data);

/** PUT /admin/tahap3/official/:id/file/:kolom — termasuk foto */
export const uploadFileOfficial = async (
  id: number,
  kolom: "foto" | "file_ktp" | "file_surat_tugas",
  file: File
): Promise<{ success: boolean; message: string; path: string }> => {
  const fd = new FormData();
  fd.append("file", file);
  return fetchJson(`${BASE_URL}/admin/tahap3/official/${id}/file/${kolom}`, {
    method: "PUT",
    body: fd,
  });
};

// ─── Transaksi Pendaftaran ────────────────────────────────

/**
 * POST /admin/tahap3/trx/atlet
 * Daftarkan atlet ke cabor + nomor.
 * Tidak butuh territory_id (pakai atlet_id langsung).
 */
export const daftarAtlet = (
  atlet_id: number,
  cabor_id: number,
  nomor_id: number
): Promise<SingleResponse<TrxAtlet>> =>
  api.post("/admin/tahap3/trx/atlet", { atlet_id, cabor_id, nomor_id }).then(r => r.data);

/** DELETE /admin/tahap3/trx/atlet/:id — :id dari trx_pendaftaran_atlet */
export const batalDaftarAtlet = (trxId: number): Promise<{ success: boolean; message: string }> =>
  api.delete(`/admin/tahap3/trx/atlet/${trxId}`).then(r => r.data);

/**
 * POST /admin/tahap3/trx/pelatih
 * Daftarkan pelatih ke cabor.
 */
export const daftarPelatih = (
  pelatih_id: number,
  cabor_id: number
): Promise<SingleResponse<TrxPelatih>> =>
  api.post("/admin/tahap3/trx/pelatih", { pelatih_id, cabor_id }).then(r => r.data);

/** DELETE /admin/tahap3/trx/pelatih/:id */
export const batalDaftarPelatih = (trxId: number): Promise<{ success: boolean; message: string }> =>
  api.delete(`/admin/tahap3/trx/pelatih/${trxId}`).then(r => r.data);

/**
 * POST /admin/tahap3/trx/official
 * Daftarkan official (tanpa cabor).
 */
export const daftarOfficial = (
  official_id: number
): Promise<SingleResponse<TrxOfficial>> =>
  api.post("/admin/tahap3/trx/official", { official_id }).then(r => r.data);

/** DELETE /admin/tahap3/trx/official/:id */
export const batalDaftarOfficial = (trxId: number): Promise<{ success: boolean; message: string }> =>
  api.delete(`/admin/tahap3/trx/official/${trxId}`).then(r => r.data);

// ─── Tahap 3 Status & Submit ──────────────────────────────

export type Tahap3Status = "DRAFT" | "SUBMITTED";

/**
 * GET /admin/tahap3 — overview endpoint.
 * Dipakai untuk ambil tahap3_status dari tabel kontingen.
 * territoryId wajib untuk superadmin.
 */
export const getTahap3Status = async (territoryId?: number): Promise<{
  tahap3_status: Tahap3Status;
  tahap3_submitted_at: string | null;
}> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  const res = await api.get("/admin/tahap3", { params });
  const kontingen = res.data?.data?.kontingen;
  return {
    tahap3_status:       kontingen?.tahap3_status      ?? "DRAFT",
    tahap3_submitted_at: kontingen?.tahap3_submitted_at ?? null,
  };
};

/**
 * POST /admin/tahap3/submit
 * Kunci tahap 3 — bulk insert trx + update status ke SUBMITTED.
 * territoryId wajib untuk superadmin.
 */
export const submitTahap3 = async (
  territoryId?: number
): Promise<{ success: boolean; message: string }> => {
  const url = territoryId
    ? `${BASE_URL}/admin/tahap3/submit?territory_id=${territoryId}`
    : `${BASE_URL}/admin/tahap3/submit`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.success === false) throw new Error(data.message || data.error || `Error ${r.status}`);
  return data;
};

