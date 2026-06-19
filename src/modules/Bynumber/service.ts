import api from "../../lib/api";

const BASE_URL = "http://localhost:8000";
const getToken = () => localStorage.getItem("token") ?? "";

// ─── Tipe data ────────────────────────────────────────────

export type Tahap2Status = "DRAFT" | "SUBMITTED";

/**
 * Satu item di nomor_list dari GET /admin/tahap2
 * Backend sudah join master_nomor + master_cabor
 */
export interface NomorItem {
  nomor_id: number;
  cabor_id: number;
  nama_cabor: string;
  nama_nomor: string;
  jenis_kelamin: "PUTRA" | "PUTRI" | "CAMPURAN";
  tipe: "INDIVIDU" | "BEREGU";
  /** true = sudah ada di trx_kontingen_nomor */
  terdaftar: boolean;
}

export interface Tahap2Response {
  success: boolean;
  message: string;
  data: {
    kontingen_id?: number;
    territory_id?: number;
    nama_kontingen?: string;
    tahap2_status: Tahap2Status;
    tahap2_submitted_at: string | null;
    tahap2_validasi_status?: "PENDING" | "VALID" | "REVISI" | null;
    tahap2_validasi_catatan?: string | null;
    nomor_list: NomorItem[];
  };
}

// ─── Endpoints ───────────────────────────────────────────

/**
 * GET /admin/tahap2
 * - Admin biasa  : tidak perlu territoryId
 * - Superadmin   : wajib kirim ?territory_id=X
 */
export const getTahap2 = (territoryId?: number): Promise<Tahap2Response> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.get("/admin/tahap2", { params }).then(r => r.data);
};

/**
 * POST /admin/tahap2/nomor/:nomor_id
 * Daftarkan satu nomor. Tidak perlu body.
 * - Superadmin wajib kirim ?territory_id=X
 */
export const daftarNomor = async (
  nomorId: number,
  territoryId?: number
): Promise<{ success: boolean; message: string }> => {
  const url = territoryId
    ? `${BASE_URL}/admin/tahap2/nomor/${nomorId}?territory_id=${territoryId}`
    : `${BASE_URL}/admin/tahap2/nomor/${nomorId}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.success === false) throw new Error(data.message || data.error || `Error ${r.status}`);
  return data;
};

/**
 * DELETE /admin/tahap2/nomor/:nomor_id
 * Batalkan pendaftaran satu nomor.
 * - Superadmin wajib kirim ?territory_id=X
 */
export const batalNomor = async (
  nomorId: number,
  territoryId?: number
): Promise<{ success: boolean; message: string }> => {
  const url = territoryId
    ? `${BASE_URL}/admin/tahap2/nomor/${nomorId}?territory_id=${territoryId}`
    : `${BASE_URL}/admin/tahap2/nomor/${nomorId}`;
  const r = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.success === false) throw new Error(data.message || data.error || `Error ${r.status}`);
  return data;
};

/**
 * POST /admin/tahap2/submit
 * Kunci tahap 2. Tidak perlu body.
 * - Superadmin wajib kirim ?territory_id=X
 */
export const submitTahap2 = async (
  territoryId?: number
): Promise<{ success: boolean; message: string }> => {
  const url = territoryId
    ? `${BASE_URL}/admin/tahap2/submit?territory_id=${territoryId}`
    : `${BASE_URL}/admin/tahap2/submit`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.success === false) throw new Error(data.message || data.error || `Error ${r.status}`);
  return data;
};
