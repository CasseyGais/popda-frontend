import api from "../../lib/api";

const BASE_URL = "http://localhost:8000";
const getToken = () => localStorage.getItem("token") ?? "";

// ─── Types ───────────────────────────────────────────────

export type TipePenerima = "ATLET" | "PELATIH" | "OFFICIAL";

export interface Sertifikat {
  id: number;
  tipe_penerima: TipePenerima;
  atlet_id: number | null;
  pelatih_id: number | null;
  official_id: number | null;
  /** Read-only — otomatis dari backend saat create */
  nama_penerima: string;
  judul: string;
  nomor_sertifikat: string | null;
  tanggal_terbit: string; // YYYY-MM-DD
  file_sertifikat: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * POST body — jangan kirim nama_penerima, diisi otomatis backend
 */
export interface CreateSertifikatPayload {
  tipe_penerima: TipePenerima;
  atlet_id?: number;    // wajib jika tipe ATLET
  pelatih_id?: number;  // wajib jika tipe PELATIH
  official_id?: number; // wajib jika tipe OFFICIAL
  judul: string;
  nomor_sertifikat?: string | null;
  tanggal_terbit: string; // YYYY-MM-DD
  catatan?: string | null;
}

/**
 * PUT body — nama_penerima, tipe_penerima, dan FK tidak bisa diubah
 */
export interface UpdateSertifikatPayload {
  judul?: string;
  nomor_sertifikat?: string | null;
  tanggal_terbit?: string;
  catatan?: string | null;
}

export interface SertifikatFilter {
  tipe?: TipePenerima;
  atlet_id?: number;
  pelatih_id?: number;
  official_id?: number;
}

/**
 * Response dari endpoint dropdown penerima — lintas semua kontingen
 * Dipakai form buat sertifikat (superadmin & staff_lapangan lihat semua)
 */
export interface PenerimaSingkat {
  id: number;
  nama_lengkap: string;
  kontingen_id: number;
  nama_kontingen: string;
}

/**
 * Data satu penandatangan untuk export PDF.
 * signature_b64: output dari signaturePad.toDataURL("image/png")
 * Backend terima dengan atau tanpa data URI prefix.
 * String kosong / tidak ada = placeholder garis kosong di PDF.
 */
export interface TTDSertifikat {
  jabatan: string;         // "Ketua Pelaksana", "Kepala Dinas", dll
  nama_tercetak: string;   // nama yang dicetak di bawah garis
  nip?: string;            // opsional
  signature_b64?: string;  // base64 PNG dari signature pad canvas
}

// ─── Helper ──────────────────────────────────────────────

/**
 * Build create payload — pastikan hanya satu FK yang terisi sesuai tipe
 */
export function buildCreatePayload(
  tipe: TipePenerima,
  penerimaId: number,
  rest: Omit<CreateSertifikatPayload, "tipe_penerima" | "atlet_id" | "pelatih_id" | "official_id">
): CreateSertifikatPayload {
  return {
    tipe_penerima: tipe,
    ...(tipe === "ATLET"    && { atlet_id:    penerimaId }),
    ...(tipe === "PELATIH"  && { pelatih_id:  penerimaId }),
    ...(tipe === "OFFICIAL" && { official_id: penerimaId }),
    ...rest,
  };
}

// ─── Service ─────────────────────────────────────────────

/**
 * GET /admin/sertifikat
 * Hanya SUPERADMIN dan STAFF_LAPANGAN — ADMIN kontingen 403.
 */
export const getAllSertifikat = (
  filters?: SertifikatFilter
): Promise<Sertifikat[]> =>
  api.get("/admin/sertifikat", { params: filters }).then(r => r.data.data);

/**
 * GET /admin/sertifikat/:id
 */
export const getSertifikatById = (id: number): Promise<Sertifikat> =>
  api.get(`/admin/sertifikat/${id}`).then(r => r.data.data);

/**
 * POST /admin/sertifikat
 * nama_penerima TIDAK dikirim — diisi otomatis backend dari nama_lengkap tabel master.
 */
export const createSertifikat = (
  payload: CreateSertifikatPayload
): Promise<Sertifikat> =>
  api.post("/admin/sertifikat", payload).then(r => r.data.data);

/**
 * PUT /admin/sertifikat/:id
 * Partial update. nama_penerima, tipe_penerima, dan FK tidak bisa diubah.
 */
export const updateSertifikat = (
  id: number,
  payload: UpdateSertifikatPayload
): Promise<Sertifikat> =>
  api.put(`/admin/sertifikat/${id}`, payload).then(r => r.data.data);

/**
 * DELETE /admin/sertifikat/:id
 * Hard delete. File PDF tidak otomatis terhapus dari storage.
 */
export const deleteSertifikat = (
  id: number
): Promise<{ success: boolean; message: string }> =>
  api.delete(`/admin/sertifikat/${id}`).then(r => r.data);

/**
 * PUT /admin/sertifikat/:id/file
 * Upload file PDF. Field name di FormData harus "file".
 */
export const uploadFileSertifikat = async (
  id: number,
  file: File
): Promise<{ success: boolean; message: string; path: string }> => {
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch(`${BASE_URL}/admin/sertifikat/${id}/file`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.success === false)
    throw new Error(data.message || `Error ${r.status}`);
  return data;
};

export const sertifikatService = {
  getAll:     getAllSertifikat,
  getById:    getSertifikatById,
  create:     createSertifikat,
  update:     updateSertifikat,
  delete:     deleteSertifikat,
  uploadFile: uploadFileSertifikat,

  /**
   * Dropdown penerima — endpoint khusus sertifikat, LINTAS semua kontingen.
   * JANGAN pakai /admin/tahap3/atlet atau /admin/master/pelatih —
   * karena difilter by kontingen dari JWT, tidak cocok untuk superadmin/staff.
   */
  getAtletDropdown: (): Promise<PenerimaSingkat[]> =>
    api.get("/admin/sertifikat/penerima/atlet").then(r => r.data.data),

  getPelatihDropdown: (): Promise<PenerimaSingkat[]> =>
    api.get("/admin/sertifikat/penerima/pelatih").then(r => r.data.data),

  getOfficialDropdown: (): Promise<PenerimaSingkat[]> =>
    api.get("/admin/sertifikat/penerima/official").then(r => r.data.data),

  /**
   * POST /admin/sertifikat/:id/export/pdf
   * Generate PDF landscape A4 satu sertifikat + tanda tangan opsional.
   * Pakai POST agar bisa kirim body JSON dengan data TTD.
   * Jika ttds kosong → PDF dengan placeholder garis TTD.
   */
  exportPDF: async (id: number, namaPenerima: string, ttds: TTDSertifikat[] = []): Promise<void> => {
    const res = await fetch(`${BASE_URL}/admin/sertifikat/${id}/export/pdf`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ penandatangan: ttds }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Error ${res.status}`);
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const safeName = namaPenerima.replace(/[^a-zA-Z0-9]/g, "_");
    a.download = `sertifikat_${safeName}.pdf`;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  /**
   * POST /admin/sertifikat/export/batch/pdf
   * Generate PDF batch — satu file multi-halaman. TTD hanya di halaman terakhir.
   * Pakai POST agar bisa kirim body JSON dengan data TTD.
   * Query param tipe opsional untuk filter.
   * 404 jika tidak ada data.
   */
  exportBatchPDF: async (tipe?: TipePenerima, ttds: TTDSertifikat[] = []): Promise<void> => {
    const params = tipe ? `?tipe=${tipe}` : "";
    const res = await fetch(`${BASE_URL}/admin/sertifikat/export/batch/pdf${params}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ penandatangan: ttds }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `Error ${res.status}`);
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = tipe ? `sertifikat_${tipe.toLowerCase()}_batch.pdf` : "sertifikat_batch.pdf";
    a.click();
    URL.revokeObjectURL(a.href);
  },
};
