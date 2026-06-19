/**
 * StatusValidasi widget
 * Tampil di dashboard admin — menunjukkan status validasi panitia per tahap.
 * Data dari GET /admin/validasi-pendaftaran/status
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTerritory } from "../../context/TerritoryContext";
import {
  validasiPendaftaranService,
  type ValidasiStatusResponse,
  type ValidasiStatus,
} from "../../modules/ValidasiPendaftaran/service";

// ─── Badge per status ─────────────────────────────────────

function Badge({ status }: { status: ValidasiStatus }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Belum disubmit
      </span>
    );
  }
  const cfg: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    PENDING: {
      dot:   "bg-blue-500",
      bg:    "bg-blue-50 dark:bg-blue-900/20",
      text:  "text-blue-700 dark:text-blue-400",
      label: "Menunggu Validasi",
    },
    VALID: {
      dot:   "bg-green-500",
      bg:    "bg-green-50 dark:bg-green-900/20",
      text:  "text-green-700 dark:text-green-400",
      label: "Valid ✓",
    },
    REVISI: {
      dot:   "bg-yellow-500",
      bg:    "bg-yellow-50 dark:bg-yellow-900/20",
      text:  "text-yellow-700 dark:text-yellow-400",
      label: "Perlu Revisi ⚠",
    },
  };
  const c = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ─── Satu baris tahap ─────────────────────────────────────

interface TahapRowProps {
  nomor: number;
  label: string;
  path: string;
  status: ValidasiStatus;
  catatan: string | null;
}

function TahapRow({ nomor, label, path, status, catatan }: TahapRowProps) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
      <Link
        to={path}
        className="text-sm font-semibold text-gray-800 dark:text-white hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
      >
        Tahap {nomor} — {label}
      </Link>
      <Badge status={status} />
      {status === "REVISI" && catatan && (
        <p className="text-xs text-yellow-600 dark:text-yellow-500 italic leading-snug">
          "{catatan}"
        </p>
      )}
    </div>
  );
}

// ─── Widget utama ─────────────────────────────────────────

export default function StatusValidasi() {
  const { can } = useAuth();
  const { currentTerritory } = useTerritory();

  const isSuperAdmin = can("*");
  const territoryId  = isSuperAdmin ? currentTerritory?.id : undefined;

  const [data, setData]       = useState<ValidasiStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Superadmin: tunggu territory dipilih
    if (isSuperAdmin && !currentTerritory?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    validasiPendaftaranService
      .getStatus(territoryId)
      .then(res => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isSuperAdmin, currentTerritory?.id, territoryId]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90">
          Status Pendaftaran
        </h3>
        <Link
          to="/rekap-pendaftaran"
          className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 font-medium"
        >
          Lihat Rekap →
        </Link>
      </div>

      {/* Superadmin belum pilih territory */}
      {isSuperAdmin && !currentTerritory && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
          Pilih wilayah untuk melihat status.
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500" />
        </div>
      )}

      {/* Data */}
      {!loading && data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TahapRow
            nomor={1}
            label="Entry By Sport"
            path="/atlet-by-sports"
            status={data.tahap1.validasi_status}
            catatan={data.tahap1.validasi_catatan}
          />
          <TahapRow
            nomor={2}
            label="Entry By Number"
            path="/atlet-by-numbers"
            status={data.tahap2.validasi_status}
            catatan={data.tahap2.validasi_catatan}
          />
          <TahapRow
            nomor={3}
            label="Entry By Name"
            path="/atlet-by-names"
            status={data.tahap3.validasi_status}
            catatan={data.tahap3.validasi_catatan}
          />
        </div>
      )}

      {/* Gagal load — tampil jika bukan kondisi "superadmin belum pilih territory" */}
      {!loading && !data && !(isSuperAdmin && !currentTerritory) && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
          Gagal memuat status.
        </p>
      )}
    </div>
  );
}
