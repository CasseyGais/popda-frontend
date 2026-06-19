import api from "../../lib/api";

const BASE_URL = "http://localhost:8000";
const getToken = () => localStorage.getItem("token") ?? "";

// ─── Enums & Konstanta ────────────────────────────────────

export type Babak =
  | "PENYISIHAN"
  | "8_BESAR"
  | "PEREMPAT_FINAL"
  | "SEMIFINAL"
  | "FINAL"
  | "PEREBUTAN_TEMPAT_3"
  | "LAINNYA";

export type Pemenang = "TIM_A" | "TIM_B" | "DRAW";

export const BABAK_OPTIONS = [
  { value: "PENYISIHAN",         label: "Penyisihan" },
  { value: "8_BESAR",            label: "8 Besar" },
  { value: "PEREMPAT_FINAL",     label: "Perempat Final" },
  { value: "SEMIFINAL",          label: "Semifinal" },
  { value: "FINAL",              label: "Final" },
  { value: "PEREBUTAN_TEMPAT_3", label: "Perebutan Tempat 3" },
  { value: "LAINNYA",            label: "Lainnya" },
] as const;

export const PEMENANG_OPTIONS = [
  { value: "TIM_A", label: "Tim A" },
  { value: "TIM_B", label: "Tim B" },
  { value: "DRAW",  label: "Seri" },
] as const;

/**
 * Helper label — toleran terhadap case apapun dari backend.
 * Backend boleh kirim "Final" atau "FINAL" — keduanya dipetakan dengan benar.
 */
export const getBabakLabel = (v: string): string =>
  BABAK_OPTIONS.find(o => o.value === v?.toUpperCase())?.label ?? v;

export const getPemenangLabel = (v: string): string =>
  PEMENANG_OPTIONS.find(o => o.value === v?.toUpperCase())?.label ?? v;

/**
 * Format tanggal dari YYYY-MM-DD atau ISO timestamp → string Indonesia.
 * MD: tanggal_pertandingan selalu "YYYY-MM-DD" dari backend (backend strip timezone).
 * Defensive: jika masih ada data lama dengan timezone, strip dulu.
 */
export const formatTanggalIndo = (raw: string): string => {
  if (!raw) return "—";
  // Ambil hanya YYYY-MM-DD (buang timezone/time jika ada)
  const dateOnly = raw.slice(0, 10);
  // Parse manual agar tidak tergantung timezone browser
  const [y, m, d] = dateOnly.split("-").map(Number);
  if (!y || !m || !d) return raw;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
};

// ─── Dropdown Types ───────────────────────────────────────

export interface KontingenDropdownItem {
  id: number;
  nama_kontingen: string;
  territory_id: number;
}

export interface CaborDropdownItem {
  id: number;
  nama: string;
  is_active: boolean;
}

export interface NomorDropdownItem {
  id: number;
  cabor_id: number;
  nama: string;
  jenis_kelamin: "PUTRA" | "PUTRI" | "CAMPURAN";
  tipe: "INDIVIDU" | "BEREGU";
}

/**
 * Atlet dari trx_pendaftaran_atlet — hanya yang sudah terdaftar di cabor+nomor.
 */
export interface AtletTerdaftarDropdownItem {
  atlet_id: number;
  nama_lengkap: string;
  kontingen_id: number;
  nama_kontingen: string;
  cabor_id: number;
  nomor_id: number;
}

// ─── Main Types ───────────────────────────────────────────

export interface AtletSisiItem {
  id: number;
  atlet_id: number;
  nama_lengkap: string;
  cabor_id: number;    // 0 jika tidak match di trx_pendaftaran_atlet
  nama_cabor: string;  // "" jika tidak match
  nomor_id: number;    // 0 jika tidak match
  nama_nomor: string;  // "" jika tidak match
  urutan: number;
}

export interface LaporanDetail {
  id: number;
  tanggal_pertandingan: string;   // selalu "YYYY-MM-DD" — backend strip timezone
  waktu_pertandingan: string;     // "HH:MM:SS"
  venue: string;
  cabor_id: number;
  nomor_id: number;
  babak: Babak;
  kontingen_a_id: number;
  kontingen_b_id: number | null;
  hasil_pertandingan: string;
  pemenang: Pemenang;
  juara_ke: number | null;
  wasit: string;
  catatan_khusus: string | null;
  foto_bukti: string | null;
  video_bukti: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  // Join fields
  nama_cabor: string;
  nama_nomor: string;
  nama_kontingen_a: string;
  nama_kontingen_b: string | null;
  atlet_a: AtletSisiItem[];
  atlet_b: AtletSisiItem[];
}

export interface CreateLaporanPayload {
  tanggal_pertandingan: string;   // YYYY-MM-DD
  waktu_pertandingan: string;     // HH:MM:SS
  venue: string;
  cabor_id: number;
  nomor_id: number;
  babak: Babak;                   // case-insensitive di backend
  kontingen_a_id: number;
  kontingen_b_id?: number;
  hasil_pertandingan: string;
  pemenang: Pemenang;             // case-insensitive di backend
  juara_ke?: number;
  wasit: string;
  catatan_khusus?: string;
  atlet_a?: number[];             // ordered list atlet_id dari trx_pendaftaran_atlet
  atlet_b?: number[];
  // JANGAN kirim created_by
}

export interface UpdateLaporanPayload {
  tanggal_pertandingan?: string;
  waktu_pertandingan?: string;
  venue?: string;
  cabor_id?: number;
  nomor_id?: number;
  babak?: Babak;
  kontingen_a_id?: number;
  kontingen_b_id?: number | null;
  hasil_pertandingan?: string;
  pemenang?: Pemenang;
  juara_ke?: number | null;
  wasit?: string;
  catatan_khusus?: string | null;
  atlet_a?: number[];   // replace semua, [] = hapus semua, tidak ada = tidak berubah
  atlet_b?: number[];
}

export interface LaporanFilter {
  tanggal?: string;
  cabor_id?: number;
  nomor_id?: number;
  babak?: Babak;
  pemenang?: Pemenang;
}

export interface TTDData {
  jabatan: string;
  nama_tercetak: string;
  nip?: string;
  signature_b64?: string; // output toDataURL("image/png") — prefix diterima backend
}

export interface ExportPDFPayload {
  tanggal?: string;
  cabor_id?: number;
  nomor_id?: number;
  penandatangan?: TTDData[];
}

// ─── Helper normalisasi response ──────────────────────────

function normalizeLaporan(l: LaporanDetail): LaporanDetail {
  return {
    ...l,
    // Pastikan tanggal hanya YYYY-MM-DD (strip timezone jika ada)
    tanggal_pertandingan: (l.tanggal_pertandingan ?? "").slice(0, 10),
    atlet_a: Array.isArray(l.atlet_a) ? l.atlet_a : [],
    atlet_b: Array.isArray(l.atlet_b) ? l.atlet_b : [],
  };
}

// ─── CRUD ────────────────────────────────────────────────

export const getAllLaporan = (
  filters?: LaporanFilter
): Promise<LaporanDetail[]> =>
  api.get("/admin/laporan-pertandingan", { params: filters }).then(r => {
    const raw = r.data.data;
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeLaporan);
  });

export const getLaporanById = (id: number): Promise<LaporanDetail> =>
  api.get(`/admin/laporan-pertandingan/${id}`).then(r => normalizeLaporan(r.data.data));

export const createLaporan = (
  payload: CreateLaporanPayload
): Promise<LaporanDetail> =>
  api.post("/admin/laporan-pertandingan", payload).then(r => normalizeLaporan(r.data.data));

export const updateLaporan = (
  id: number,
  payload: UpdateLaporanPayload
): Promise<LaporanDetail> =>
  api.put(`/admin/laporan-pertandingan/${id}`, payload).then(r => normalizeLaporan(r.data.data));

export const deleteLaporan = (
  id: number
): Promise<{ success: boolean; message: string }> =>
  api.delete(`/admin/laporan-pertandingan/${id}`).then(r => r.data);

// ─── Upload ───────────────────────────────────────────────

export const uploadFotoLaporan = async (
  id: number,
  file: File
): Promise<{ success: boolean; message: string; path: string }> => {
  const fd = new FormData();
  fd.append("foto", file); // field name wajib: "foto"
  const r = await fetch(`${BASE_URL}/admin/laporan-pertandingan/${id}/foto`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.success === false) throw new Error(data.message || `Error ${r.status}`);
  return data;
};

export const uploadVideoLaporan = async (
  id: number,
  file: File
): Promise<{ success: boolean; message: string; path: string }> => {
  const fd = new FormData();
  fd.append("video", file); // field name wajib: "video"
  const r = await fetch(`${BASE_URL}/admin/laporan-pertandingan/${id}/video`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.success === false) throw new Error(data.message || `Error ${r.status}`);
  return data;
};

// ─── Dropdown ─────────────────────────────────────────────

export const getKontingenDropdown = (): Promise<KontingenDropdownItem[]> =>
  api.get("/admin/laporan-pertandingan/dropdown/kontingen").then(r => r.data.data ?? []);

export const getCaborDropdown = (): Promise<CaborDropdownItem[]> =>
  api.get("/admin/laporan-pertandingan/dropdown/cabor").then(r => r.data.data ?? []);

export const getNomorDropdown = (caborId?: number): Promise<NomorDropdownItem[]> =>
  api.get("/admin/laporan-pertandingan/dropdown/nomor", {
    params: caborId ? { cabor_id: caborId } : {},
  }).then(r => r.data.data ?? []);

/**
 * GET /admin/laporan-pertandingan/dropdown/atlet
 * Hanya atlet yang sudah terdaftar di trx_pendaftaran_atlet.
 * Alur: cabor → nomor → kontingen A → atlet A (filter kontingen+cabor+nomor)
 *                     → kontingen B → atlet B (filter kontingen+cabor+nomor)
 */
export const getAtletDropdown = (params: {
  kontingen_id?: number;
  cabor_id?: number;
  nomor_id?: number;
}): Promise<AtletTerdaftarDropdownItem[]> =>
  api.get("/admin/laporan-pertandingan/dropdown/atlet", { params }).then(r => r.data.data ?? []);

// ─── Export PDF ───────────────────────────────────────────

/**
 * POST /admin/laporan-pertandingan/:id/export/pdf
 * Route statis /export/pdf dan /dropdown/* terdaftar sebelum /:id di backend.
 */
export const exportSatuPDF = async (
  id: number,
  payload: ExportPDFPayload = {}
): Promise<void> => {
  const res = await fetch(`${BASE_URL}/admin/laporan-pertandingan/${id}/export/pdf`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `laporan_${id}.pdf`;
  a.click();
  URL.revokeObjectURL(a.href);
};

/** POST /admin/laporan-pertandingan/export/pdf — batch */
export const exportBatchPDF = async (
  payload: ExportPDFPayload = {}
): Promise<void> => {
  const res = await fetch(`${BASE_URL}/admin/laporan-pertandingan/export/pdf`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `laporan_pertandingan_${payload.tanggal ?? "semua"}.pdf`;
  a.click();
  URL.revokeObjectURL(a.href);
};

// ─── Service object ───────────────────────────────────────

export const laporanPertandinganService = {
  getAll:               getAllLaporan,
  getById:              getLaporanById,
  create:               createLaporan,
  update:               updateLaporan,
  delete:               deleteLaporan,
  uploadFoto:           uploadFotoLaporan,
  uploadVideo:          uploadVideoLaporan,
  getKontingenDropdown,
  getCaborDropdown,
  getNomorDropdown,
  getAtletDropdown,
  exportSatu:           exportSatuPDF,
  exportBatch:          exportBatchPDF,
};
