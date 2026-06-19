/**
 * RekapPendaftaran service
 * Re-export dari ValidasiPendaftaran/service — endpoint yang sama
 * GET /admin/rekap-pendaftaran
 */
export {
  getRekapPendaftaran,
  type RekapPendaftaran,
  type RekapAtlet,
  type RekapPelatih,
  type RekapOfficial,
  type ValidasiStatus,
} from "../ValidasiPendaftaran/service";
