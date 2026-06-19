import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { useAuth } from "../../../context/AuthContext";
import { useTerritory } from "../../../context/TerritoryContext";
import { getRekapPendaftaran, type RekapPendaftaran } from "../service";
import StatusValidasiBadge from "../components/StatusValidasiBadge";
import RekapCaborNomor from "../components/RekapCaborNomor";
import RekapAtletTable from "../components/RekapAtletTable";
import RekapPelatihTable from "../components/RekapPelatihTable";
import RekapOfficialTable from "../components/RekapOfficialTable";

export default function MainPage() {
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const { can }   = useAuth();
  const { currentTerritory } = useTerritory();

  const isSuperAdmin = can("*");

  /**
   * territory_id bisa datang dari dua sumber:
   * 1. URL param ?territory_id=X — saat superadmin klik Detail dari ValidasiPage
   * 2. TerritoryContext (currentTerritory) — pilihan di territory selector
   * URL param lebih prioritas jika ada.
   */
  const urlTerritoryId = searchParams.get("territory_id")
    ? Number(searchParams.get("territory_id"))
    : undefined;
  const territoryId = isSuperAdmin
    ? (urlTerritoryId ?? currentTerritory?.id)
    : undefined;

  const [data, setData]       = useState<RekapPendaftaran | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const fetchData = useCallback(async (tid: number | undefined) => {
    setLoading(true);
    setError("");
    try {
      const result = await getRekapPendaftaran(tid);
      setData(result);
    } catch (e: any) {
      setError(e.message || "Gagal memuat data rekap");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Superadmin tanpa URL param dan tanpa territory context → tunggu
    if (isSuperAdmin && !territoryId) return;
    fetchData(territoryId);
  }, [isSuperAdmin, territoryId, fetchData]);

  // ── Superadmin belum pilih territory dan tidak ada URL param ────
  if (isSuperAdmin && !territoryId) {
    return (
      <>
        <PageMeta title="Rekap Pendaftaran" description="Ringkasan data pendaftaran kontingen" />
        <PageBreadcrumb pageTitle="Rekap Pendaftaran" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Pilih wilayah dari selector di atas untuk melihat data.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Rekap Pendaftaran" description="Ringkasan data pendaftaran kontingen" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Rekap Pendaftaran" />

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {data?.nama_kontingen ?? (currentTerritory?.name ?? "")}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Data ini bersifat read-only. Untuk mengubah data, gunakan halaman Tahap masing-masing.
            </p>
          </div>
          {/* Shortcut ke halaman tahap */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => navigate("/atlet-by-sports")}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Edit Tahap 1
            </button>
            <button
              onClick={() => navigate("/atlet-by-numbers")}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Edit Tahap 2
            </button>
            <button
              onClick={() => navigate("/atlet-by-names")}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Edit Tahap 3
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Memuat rekap{currentTerritory ? ` ${currentTerritory.name}` : ""}...
            </span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20 px-5 py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* ── Status Validasi ── */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Status Validasi Panitia</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Tahap 1 */}
                <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-3 space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tahap 1 — By Sport</p>
                  <StatusValidasiBadge
                    status={data.validasi.tahap1.status}
                    catatan={data.validasi.tahap1.catatan}
                    showCatatan
                  />
                </div>
                {/* Tahap 2 */}
                <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-3 space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tahap 2 — By Number</p>
                  <StatusValidasiBadge
                    status={data.validasi.tahap2.status}
                    catatan={data.validasi.tahap2.catatan}
                    showCatatan
                  />
                </div>
                {/* Tahap 3 */}
                <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-3 space-y-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tahap 3 — By Name</p>
                  <StatusValidasiBadge
                    status={data.validasi.tahap3.status}
                    catatan={data.validasi.tahap3.catatan}
                    showCatatan
                  />
                </div>
              </div>
            </div>

            {/* ── Summary count ── */}
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                Atlet: <strong className="ml-1">{data.atlets.length}</strong>
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                Pelatih: <strong className="ml-1">{data.pelatihs.length}</strong>
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                Official: <strong className="ml-1">{data.officials.length}</strong>
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                Cabor: <strong className="ml-1">{data.cabor_terpilih.length}</strong>
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                Nomor: <strong className="ml-1">{data.nomor_terdaftar.length}</strong>
              </span>
            </div>

            {/* ── Cabor & Nomor ── */}
            <RekapCaborNomor
              cabor_terpilih={data.cabor_terpilih}
              nomor_terdaftar={data.nomor_terdaftar}
            />

            {/* ── Atlet ── */}
            <RekapAtletTable atlets={data.atlets} />

            {/* ── Pelatih ── */}
            <RekapPelatihTable pelatihs={data.pelatihs} />

            {/* ── Official ── */}
            <RekapOfficialTable officials={data.officials} />
          </>
        )}
      </div>
    </>
  );
}
