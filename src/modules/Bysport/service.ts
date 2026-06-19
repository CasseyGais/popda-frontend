import api from "../../lib/api";

const BASE_URL = "http://localhost:8000";
const getToken = () => localStorage.getItem("token") ?? "";

// ─── Master Cabor ────────────────────────────────────────
export interface MasterCabor {
  id: number;
  nama: string;
  max_putra: number;
  max_putri: number;
  max_pelatih: number;
  is_active: boolean;
  created_at: string;
}

export interface MasterCaborResponse {
  success: boolean;
  message: string;
  data: MasterCabor[];
}

export const getMasterCabor = (): Promise<MasterCaborResponse> =>
  api.get("/admin/master/cabor").then(r => r.data);

// ─── Tahap 1 ─────────────────────────────────────────────
export interface TrxKontingenCabor {
  id: number;
  kontingen_id: number;
  cabor_id: number;
  putra: number;
  putri: number;
  pelatih: number;
  total_atlet: number;
  total_personel: number;
  created_at: string;
}

export type Tahap1Status = "DRAFT" | "SUBMITTED";

export interface Tahap1Response {
  success: boolean;
  message: string;
  data: {
    kontingen_id?: number;
    territory_id?: number;
    nama_kontingen?: string;
    tahap1_status: Tahap1Status;
    tahap1_submitted_at: string | null;
    tahap1_validasi_status?: "PENDING" | "VALID" | "REVISI" | null;
    tahap1_validasi_catatan?: string | null;
    cabor_list: TrxKontingenCabor[];
  };
}

/**
 * GET /admin/tahap1
 * - Admin biasa  : tidak perlu territoryId — kontingen_id dari JWT
 * - Superadmin   : kirim ?territory_id=X agar backend resolve kontingen dari territory
 */
export const getTahap1 = (territoryId?: number): Promise<Tahap1Response> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.get("/admin/tahap1", { params }).then(r => r.data);
};

// ─── PUT /admin/tahap1 — upsert cabor (form-data) ────────
export interface TrxCaborPayload {
  cabor_id: number;
  putra: number;
  putri: number;
  pelatih: number;
}

const buildFormData = (p: TrxCaborPayload): FormData => {
  const fd = new FormData();
  fd.append("cabor_id", String(p.cabor_id));
  fd.append("putra",    String(p.putra));
  fd.append("putri",    String(p.putri));
  fd.append("pelatih",  String(p.pelatih));
  return fd;
};

/**
 * PUT /admin/tahap1
 * - territoryId wajib untuk superadmin, undefined untuk admin biasa
 */
export const upsertTahap1Cabor = async (
  payload: TrxCaborPayload,
  territoryId?: number
): Promise<{ success: boolean; message: string }> => {
  const url = territoryId
    ? `${BASE_URL}/admin/tahap1?territory_id=${territoryId}`
    : `${BASE_URL}/admin/tahap1`;
  const r = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: buildFormData(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.success === false) throw new Error(data.message || data.error || `Error ${r.status}`);
  return data;
};

/**
 * DELETE /admin/tahap1/:cabor_id
 * - territoryId wajib untuk superadmin, undefined untuk admin biasa
 */
export const deleteTahap1Cabor = async (
  caborId: number,
  territoryId?: number
): Promise<{ success: boolean; message: string }> => {
  const url = territoryId
    ? `${BASE_URL}/admin/tahap1/${caborId}?territory_id=${territoryId}`
    : `${BASE_URL}/admin/tahap1/${caborId}`;
  const r = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.success === false) throw new Error(data.message || data.error || `Error ${r.status}`);
  return data;
};

/**
 * POST /admin/tahap1/submit
 * - territoryId wajib untuk superadmin, undefined untuk admin biasa
 */
export const submitTahap1 = async (
  territoryId?: number
): Promise<{ success: boolean; message: string }> => {
  const url = territoryId
    ? `${BASE_URL}/admin/tahap1/submit?territory_id=${territoryId}`
    : `${BASE_URL}/admin/tahap1/submit`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.success === false) throw new Error(data.message || data.error || `Error ${r.status}`);
  return data;
};
