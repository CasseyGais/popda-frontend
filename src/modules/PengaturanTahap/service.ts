import api from "../../lib/api";

// ─── Types ───────────────────────────────────────────────

export interface PengaturanTahap {
  id: number;
  tahap: 1 | 2 | 3;
  is_open: boolean;
  tanggal_buka: string | null;
  tanggal_tutup: string | null;
  updated_at: string;
}

export interface UpdatePengaturanTahapPayload {
  is_open?: boolean;
  tanggal_buka?: string;  // "" untuk clear → null di DB
  tanggal_tutup?: string; // "" untuk clear → null di DB
}

// ─── Service ─────────────────────────────────────────────

/**
 * GET /admin/pengaturan-tahap
 * Semua role bisa akses.
 * Return array 3 item — tahap 1, 2, 3 diurutkan ascending.
 */
export const getAllPengaturanTahap = (): Promise<PengaturanTahap[]> =>
  api.get("/admin/pengaturan-tahap").then(r => r.data.data);

/**
 * Helper — ambil status satu tahap tertentu dari array.
 */
export const getPengaturanByTahap = (
  list: PengaturanTahap[],
  tahap: 1 | 2 | 3
): PengaturanTahap | null =>
  list.find(p => p.tahap === tahap) ?? null;

/**
 * PUT /admin/pengaturan-tahap/:tahap
 * Superadmin only — partial update, kirim hanya field yang mau diubah.
 * Untuk hapus tanggal, kirim string kosong "".
 */
export const updatePengaturanTahap = (
  tahap: 1 | 2 | 3,
  payload: UpdatePengaturanTahapPayload
): Promise<PengaturanTahap> =>
  api.put(`/admin/pengaturan-tahap/${tahap}`, payload).then(r => r.data.data);

/**
 * Shorthand — toggle is_open saja tanpa ubah tanggal.
 */
export const toggleTahap = (
  tahap: 1 | 2 | 3,
  isOpen: boolean
): Promise<PengaturanTahap> =>
  updatePengaturanTahap(tahap, { is_open: isOpen });

export const pengaturanTahapService = {
  getAll: getAllPengaturanTahap,
  getByTahap: getPengaturanByTahap,
  update: updatePengaturanTahap,
  toggle: toggleTahap,
};
