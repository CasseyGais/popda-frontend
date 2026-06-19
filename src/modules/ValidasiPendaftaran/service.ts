import api from "../../lib/api";

// ─── Types ───────────────────────────────────────────────

export type ValidasiStatus = "PENDING" | "VALID" | "REVISI" | null;

/** Status validasi satu tahap — dipakai di widget dan response GET tahap */
export interface ValidasiPerTahap {
  validasi_status: ValidasiStatus;
  validasi_catatan: string | null;
}

/** Response GET /admin/validasi-pendaftaran/status — untuk widget dashboard */
export interface ValidasiStatusResponse {
  kontingen_id: number;
  nama_kontingen: string;
  tahap1: ValidasiPerTahap;
  tahap2: ValidasiPerTahap;
  tahap3: ValidasiPerTahap;
}

/** Satu item di list GET /admin/validasi-pendaftaran — untuk panel superadmin */
export interface ValidasiKontingen {
  kontingen_id: number;
  territory_id: number;
  nama_kontingen: string;
  tahap1: {
    submit_status: "DRAFT" | "SUBMITTED";
    submitted_at: string | null;
    validasi_status: ValidasiStatus;
    validasi_catatan: string | null;
    validasi_at: string | null;
  };
  tahap2: {
    submit_status: "DRAFT" | "SUBMITTED";
    submitted_at: string | null;
    validasi_status: ValidasiStatus;
    validasi_catatan: string | null;
    validasi_at: string | null;
  };
  tahap3: {
    submit_status: "DRAFT" | "SUBMITTED";
    submitted_at: string | null;
    validasi_status: ValidasiStatus;
    validasi_catatan: string | null;
    validasi_at: string | null;
  };
}

/** Payload untuk PUT /admin/validasi-pendaftaran/:id/tahap/:tahap */
export interface SetValidasiPayload {
  status: "VALID" | "REVISI";
  catatan: string | null;
}

/** Atlet dalam response rekap (include trx) */
export interface RekapAtlet {
  id: number;
  nama_lengkap: string;
  jenis_kelamin: "L" | "P";
  tanggal_lahir: string;
  nisn: string;
  sekolah: string;
  kelas_jurusan: string | null;
  kabupaten_kota: string;
  no_hp: string | null;
  status: string;
  trx: {
    atlet_id: number;
    cabor_id: number;
    nama_cabor: string;
    nomor_id: number;
    nama_nomor: string;
    jenis_kelamin: string;
    tipe: string;
  }[];
}

/** Pelatih dalam response rekap (include trx) */
export interface RekapPelatih {
  id: number;
  nama_lengkap: string;
  jenis_kelamin: "L" | "P";
  jabatan: string | null;
  no_hp: string;
  status: string;
  trx: { pelatih_id: number; cabor_id: number; nama_cabor: string }[];
}

/** Official dalam response rekap (include trx) */
export interface RekapOfficial {
  id: number;
  nama_lengkap: string;
  jenis_kelamin: "L" | "P";
  jabatan: string;
  no_hp: string;
  status: string;
  trx: { keterangan: string }[];
}

/** Response GET /admin/rekap-pendaftaran */
export interface RekapPendaftaran {
  kontingen_id: number;
  territory_id: number;
  nama_kontingen: string;
  validasi: {
    tahap1: { status: ValidasiStatus; catatan: string | null };
    tahap2: { status: ValidasiStatus; catatan: string | null };
    tahap3: { status: ValidasiStatus; catatan: string | null };
  };
  cabor_terpilih: {
    cabor_id: number;
    nama_cabor: string;
    putra: number;
    putri: number;
    pelatih: number;
    total_atlet: number;
  }[];
  nomor_terdaftar: {
    nomor_id: number;
    cabor_id: number;
    nama_cabor: string;
    nama_nomor: string;
    jenis_kelamin: string;
    tipe: string;
  }[];
  atlets: RekapAtlet[];
  pelatihs: RekapPelatih[];
  officials: RekapOfficial[];
}

// ─── Service ─────────────────────────────────────────────

/**
 * GET /admin/validasi-pendaftaran/status
 * Semua role. Admin biasa → data sendiri, superadmin → kirim territory_id.
 * Dipakai widget dashboard.
 */
export const getValidasiStatus = (territoryId?: number): Promise<ValidasiStatusResponse> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.get("/admin/validasi-pendaftaran/status", { params }).then(r => r.data.data);
};

/**
 * GET /admin/rekap-pendaftaran
 * Semua role. Admin biasa → data sendiri, superadmin → kirim territory_id.
 * Dipakai halaman Rekap Pendaftaran (admin) dan detail validasi (superadmin).
 */
export const getRekapPendaftaran = (territoryId?: number): Promise<RekapPendaftaran> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.get("/admin/rekap-pendaftaran", { params }).then(r => r.data.data);
};

/**
 * GET /admin/validasi-pendaftaran
 * Superadmin only. List semua kontingen beserta status validasi 3 tahap.
 */
export const getValidasiList = (filters?: {
  status?: string;
  tahap?: number;
  territory_id?: number;
}): Promise<ValidasiKontingen[]> =>
  api.get("/admin/validasi-pendaftaran", { params: filters }).then(r => r.data.data);

/**
 * PUT /admin/validasi-pendaftaran/:kontingen_id/tahap/:tahap
 * Superadmin only. Set VALID atau REVISI (REVISI wajib ada catatan).
 */
export const setValidasi = (
  kontingenId: number,
  tahap: 1 | 2 | 3,
  payload: SetValidasiPayload
): Promise<{ kontingen_id: number; tahap: number; status: string; catatan: string | null; validasi_at: string }> =>
  api
    .put(`/admin/validasi-pendaftaran/${kontingenId}/tahap/${tahap}`, payload)
    .then(r => r.data.data);

export const validasiPendaftaranService = {
  getStatus: getValidasiStatus,
  getRekap: getRekapPendaftaran,
  getList: getValidasiList,
  setValidasi,
};
