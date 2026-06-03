import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { useAuth } from "../../../context/AuthContext";
import { useTerritory } from "../../../context/TerritoryContext";
import {
  getTahap2,
  daftarNomor,
  batalNomor,
  submitTahap2,
  NomorItem,
  Tahap2Status,
} from "../service";

// ─── helpers ─────────────────────────────────────────────

function checkSuperAdmin(user: ReturnType<typeof useAuth>["user"]): boolean {
  if (!user) return false;
  const roleName = (user.role?.name ?? "").toLowerCase();
  if (["superadmin", "super_admin", "super admin"].includes(roleName)) return true;
  if (user.territories && user.territories.length > 5) return true;
  return false;
}

const KELAMIN_BADGE: Record<string, string> = {
  PUTRA:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PUTRI:    "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  CAMPURAN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

function StatusBadge({ status }: { status: Tahap2Status }) {
  if (status === "SUBMITTED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/40">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        SUBMITTED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/40">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
      DRAFT
    </span>
  );
}

// ─── Main component ───────────────────────────────────────

export default function MainPage() {
  const navigate = useNavigate();
  const { user, can }        = useAuth();
  const { currentTerritory } = useTerritory();
  const isSuperAdmin         = checkSuperAdmin(user);

  const [nomorList, setNomorList]       = useState<NomorItem[]>([]);
  const [tahap2Status, setTahap2Status] = useState<Tahap2Status>("DRAFT");
  const [loading, setLoading]           = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError]               = useState("");
  // nomorId yang sedang diproses (toggle) — untuk disable checkbox sementara
  const [toggling, setToggling]         = useState<Set<number>>(new Set());

  /**
   * territory_id diteruskan ke service:
   * - superadmin → currentTerritory.id
   * - admin biasa → undefined (backend pakai JWT)
   */
  const territoryId = isSuperAdmin ? currentTerritory?.id : undefined;

  const fetchAll = useCallback(async (tid: number | undefined) => {
    setLoading(true);
    setError("");
    try {
      const res = await getTahap2(tid);
      setNomorList(res.data?.nomor_list || []);
      setTahap2Status(res.data?.tahap2_status ?? "DRAFT");
    } catch (e: any) {
      const msg: string = e.message || "Gagal memuat data";
      // Tahap 1 belum submit → tampilkan pesan khusus
      if (msg.toLowerCase().includes("tahap 1")) {
        setError("tahap1_belum_submit");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin && !currentTerritory?.id) return;
    fetchAll(territoryId);
  }, [isSuperAdmin, currentTerritory?.id, fetchAll, territoryId]);

  // ── toggle centang / uncentang satu nomor ──────────────
  const handleToggle = async (item: NomorItem) => {
    if (tahap2Status === "SUBMITTED") return;
    if (toggling.has(item.nomor_id)) return;

    // Check permission based on action
    if (item.terdaftar) {
      if (!can("trx_kontingen_nomor.delete")) return;
    } else {
      if (!can("trx_kontingen_nomor.create")) return;
    }

    setToggling(prev => new Set(prev).add(item.nomor_id));
    setError("");
    try {
      if (item.terdaftar) {
        await batalNomor(item.nomor_id, territoryId);
      } else {
        await daftarNomor(item.nomor_id, territoryId);
      }
      // Update state lokal langsung tanpa re-fetch untuk UX yang responsif
      setNomorList(prev =>
        prev.map(n =>
          n.nomor_id === item.nomor_id ? { ...n, terdaftar: !n.terdaftar } : n
        )
      );
    } catch (e: any) {
      setError(e.message || "Gagal mengubah status nomor");
    } finally {
      setToggling(prev => {
        const next = new Set(prev);
        next.delete(item.nomor_id);
        return next;
      });
    }
  };

  // ── submit tahap 2 ──────────────────────────────────────
  const handleSubmit = async () => {
    if (!confirm("Data tidak dapat diubah setelah disubmit. Lanjutkan?")) return;
    setSubmitLoading(true);
    setError("");
    try {
      await submitTahap2(territoryId);
      await fetchAll(territoryId);
    } catch (e: any) {
      setError(e.message || "Gagal submit tahap 2");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── group nomor_list berdasarkan nama_cabor ─────────────
  const grouped: { cabor: string; items: NomorItem[] }[] = [];
  for (const item of nomorList) {
    const existing = grouped.find(g => g.cabor === item.nama_cabor);
    if (existing) existing.items.push(item);
    else grouped.push({ cabor: item.nama_cabor, items: [item] });
  }

  const totalTerdaftar = nomorList.filter(n => n.terdaftar).length;
  const isSubmitted    = tahap2Status === "SUBMITTED";
  const canSubmit      = !isSubmitted && totalTerdaftar > 0;

  // ── Superadmin belum pilih territory ───────────────────
  if (isSuperAdmin && !currentTerritory) {
    return (
      <>
        <PageMeta title="Tahap II: Entry By Number" description="Pendaftaran nomor pertandingan" />
        <PageBreadcrumb pageTitle="Tahap II: Entry By Number" />
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
      <PageMeta title="Tahap II: Entry By Number" description="Pendaftaran nomor pertandingan" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Tahap II: Entry By Number" />

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            {isSuperAdmin && currentTerritory && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {currentTerritory.name}
              </p>
            )}
            {!isSuperAdmin && user?.name && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {user.name}
              </p>
            )}
          </div>
          {!loading && error !== "tahap1_belum_submit" && (
            <StatusBadge status={tahap2Status} />
          )}
        </div>

        {/* Banner submitted */}
        {!loading && isSubmitted && (
          <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/20 px-5 py-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Tahap 2 sudah disubmit. 
            </p>
          </div>
        )}

        {/* Error: tahap 1 belum submit */}
        {error === "tahap1_belum_submit" && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-900/20 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                Tahap 1 belum disubmit. Selesaikan Tahap 1 terlebih dahulu.
              </p>
            </div>
            <button
              onClick={() => navigate("/atlet-by-sports")}
              className="shrink-0 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold transition-colors"
            >
              Ke Tahap 1
            </button>
          </div>
        )}

        {/* Error umum */}
        {error && error !== "tahap1_belum_submit" && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20 px-5 py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Memuat data{currentTerritory ? ` ${currentTerritory.name}` : ""}...
            </span>
          </div>
        ) : error !== "tahap1_belum_submit" && (
          <>
            {/* Summary bar */}
            {nomorList.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  Total tersedia: <strong className="ml-1">{nomorList.length}</strong>
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  Terdaftar: <strong className="ml-1">{totalTerdaftar}</strong>
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                  Belum: <strong className="ml-1">{nomorList.length - totalTerdaftar}</strong>
                </span>
              </div>
            )}

            {/* Daftar nomor grouped by cabor */}
            {grouped.length === 0 ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-16 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Belum ada nomor tersedia. Pastikan Tahap 1 sudah disubmit dengan cabor yang aktif.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {grouped.map(({ cabor, items }) => (
                  <div key={cabor} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                    {/* Cabor header */}
                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{cabor}</h3>
                      <span className="text-xs text-gray-400">
                        {items.filter(i => i.terdaftar).length}/{items.length} terdaftar
                      </span>
                    </div>

                    {/* Nomor list */}
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {items.map(item => {
                        const isToggling = toggling.has(item.nomor_id);
                        return (
                          <label
                            key={item.nomor_id}
                            className={[
                              "flex items-center gap-4 px-5 py-3 transition-colors",
                              isSubmitted
                                ? "cursor-default"
                                : "cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-800/30",
                              isToggling ? "opacity-60" : "",
                            ].join(" ")}
                          >
                            {/* Checkbox */}
                            <div className="shrink-0">
                              {isSubmitted ? (
                                // Read-only saat SUBMITTED
                                <div className={[
                                  "w-5 h-5 rounded border-2 flex items-center justify-center",
                                  item.terdaftar
                                    ? "bg-brand-500 border-brand-500"
                                    : "border-gray-300 dark:border-gray-600",
                                ].join(" ")}>
                                  {item.terdaftar && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={item.terdaftar}
                                  disabled={isToggling}
                                  onChange={() => handleToggle(item)}
                                  className="w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 cursor-pointer"
                                />
                              )}
                            </div>

                            {/* Info nomor */}
                            <div className="flex-1 min-w-0" onClick={() => !isSubmitted && handleToggle(item)}>
                              <span className="text-sm font-medium text-gray-800 dark:text-white">
                                {item.nama_nomor}
                              </span>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={[
                                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                KELAMIN_BADGE[item.jenis_kelamin] || KELAMIN_BADGE.CAMPURAN,
                              ].join(" ")}>
                                {item.jenis_kelamin}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                {item.tipe}
                              </span>
                              {/* Loading spinner saat toggle */}
                              {isToggling && (
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tombol submit */}
            {canSubmit && (
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitLoading}
                  className="px-6 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitLoading ? "Menyimpan..." : "Submit Tahap 2"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
