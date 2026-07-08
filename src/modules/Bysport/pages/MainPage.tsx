import { useState, useEffect, useCallback } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { useAuth } from "../../../context/AuthContext";
import { useTerritory } from "../../../context/TerritoryContext";
import {
  getMasterCabor,
  getTahap1,
  upsertTahap1Cabor,
  deleteTahap1Cabor,
  submitTahap1,
  resetTahap1,
  MasterCabor,
  TrxKontingenCabor,
  Tahap1Status,
} from "../service";
import { pengaturanTahapService, PengaturanTahap } from "../../PengaturanTahap/service";
import CaborEntryModal from "../components/Modal";
import ExportButtons from "../../../components/ui/ExportButtons";
import { exportTahap1PDF, exportTahap1Excel } from "../../../utils/exportHelper";
import { ResetTahapButton } from "../../../components/popda/ResetTahapButton";

export interface CaborEntry {
  cabor_id: number;
  nama: string;
  putra: number;
  putri: number;
  pelatih: number;
  total_atlet: number;
  total_personel: number;
  max_putra: number;
  max_putri: number;
  max_pelatih: number;
  sudahAda: boolean;
}

function StatusBadge({ status }: { status: Tahap1Status }) {
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

export default function MainPage() {
  const { user, can }          = useAuth();
  const { currentTerritory }   = useTerritory();
  // Gunakan can("*") — superadmin selalu punya wildcard permission
  // Ini lebih reliable dari cek role.name yang formatnya bisa beda-beda
  const isSuperAdmin           = can("*");

  const [masterCabor, setMasterCabor]     = useState<MasterCabor[]>([]);
  const [trxCabor, setTrxCabor]           = useState<TrxKontingenCabor[]>([]);
  const [tahap1Status, setTahap1Status]   = useState<Tahap1Status>("DRAFT");
  const [validasiStatus, setValidasiStatus] = useState<"PENDING" | "VALID" | "REVISI" | null>(null);
  const [validasiCatatan, setValidasiCatatan] = useState<string | null>(null);
  const [loading, setLoading]             = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError]                 = useState("");

  // Status pengaturan tahap (buka/tutup)
  const [pengaturan, setPengaturan] = useState<PengaturanTahap | null>(null);

  const [modalOpen, setModalOpen]     = useState(false);
  const [modalMode, setModalMode]     = useState<"view" | "add" | "edit">("add");
  const [activeEntry, setActiveEntry] = useState<CaborEntry | null>(null);

  /**
   * territoryId untuk diteruskan ke semua service call:
   * - superadmin: currentTerritory.id (backend resolve kontingen dari sini)
   * - admin biasa: undefined (backend pakai kontingen_id dari JWT)
   */
  const territoryId = isSuperAdmin ? currentTerritory?.id : undefined;

  const fetchAll = useCallback(async (tid: number | undefined) => {
    setLoading(true);
    setError("");
    try {
      const [masterRes, tahap1Res, pengaturanList] = await Promise.all([
        getMasterCabor(),
        getTahap1(tid),
        pengaturanTahapService.getAll(),
      ]);
      setMasterCabor(masterRes.data || []);
      setTrxCabor(tahap1Res.data?.cabor_list || []);
      setTahap1Status(tahap1Res.data?.tahap1_status ?? "DRAFT");
      setValidasiStatus(tahap1Res.data?.tahap1_validasi_status ?? null);
      setValidasiCatatan(tahap1Res.data?.tahap1_validasi_catatan ?? null);
      setPengaturan(pengaturanTahapService.getByTahap(pengaturanList, 1));
    } catch (e: any) {
      setError(e.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Superadmin harus punya territory terpilih dulu sebelum fetch
    if (isSuperAdmin && !currentTerritory?.id) return;
    fetchAll(territoryId);
  }, [isSuperAdmin, currentTerritory?.id, fetchAll, territoryId]);

  const entries: CaborEntry[] = trxCabor.map(trx => {
    const m = masterCabor.find(x => x.id === trx.cabor_id);
    return {
      cabor_id: trx.cabor_id,
      nama: m?.nama ?? `Cabor #${trx.cabor_id}`,
      putra: trx.putra, putri: trx.putri, pelatih: trx.pelatih,
      total_atlet: trx.total_atlet, total_personel: trx.total_personel,
      max_putra: m?.max_putra ?? 0, max_putri: m?.max_putri ?? 0, max_pelatih: m?.max_pelatih ?? 0,
      sudahAda: true,
    };
  });

  const availableCabor = masterCabor.filter(m => !trxCabor.some(t => t.cabor_id === m.id));
  const isSubmitted    = tahap1Status === "SUBMITTED";
  // Superadmin selalu lolos meski tahap tutup — untuk monitoring
  const tahapTutup     = !isSuperAdmin && pengaturan !== null && !pengaturan.is_open;
  // Superadmin selalu bisa edit/hapus, admin biasa dibatasi status & tahap
  const canEdit        = isSuperAdmin || (!isSubmitted && !tahapTutup);
  const canSubmit      = !isSubmitted && !tahapTutup && entries.length > 0;
  // Superadmin bisa reset ke DRAFT kapan saja data sudah SUBMITTED
  const canReset       = isSuperAdmin && isSubmitted;

  const handleReset = async () => {
    // territoryId pasti ada karena canReset hanya true jika isSuperAdmin (sudah pilih territory)
    await resetTahap1(territoryId!);
    await fetchAll(territoryId);
  };

  const openAdd = (cabor: MasterCabor) => {
    setActiveEntry({
      cabor_id: cabor.id, nama: cabor.nama, putra: 0, putri: 0, pelatih: 0,
      total_atlet: 0, total_personel: 0,
      max_putra: cabor.max_putra, max_putri: cabor.max_putri, max_pelatih: cabor.max_pelatih,
      sudahAda: false,
    });
    setModalMode("add");
    setModalOpen(true);
  };

  const openViewEdit = (entry: CaborEntry, mode: "view" | "edit") => {
    setActiveEntry(entry);
    setModalMode(mode);
    setModalOpen(true);
  };

  const handleModalSave = async (entry: CaborEntry) => {
    setError("");
    // Selalu kirim territoryId — undefined untuk admin biasa, angka untuk superadmin
    await upsertTahap1Cabor(
      { cabor_id: entry.cabor_id, putra: entry.putra, putri: entry.putri, pelatih: entry.pelatih },
      territoryId
    );
    setModalOpen(false);
    await fetchAll(territoryId);
  };

  const handleDelete = async (caborId: number, nama: string) => {
    if (!confirm(`Hapus ${nama} dari daftar?`)) return;
    setError("");
    try {
      await deleteTahap1Cabor(caborId, territoryId);
      await fetchAll(territoryId);
    } catch (e: any) { setError(e.message || "Gagal menghapus cabor"); }
  };

  const handleSubmit = async () => {
    if (!confirm("Data tidak dapat diubah setelah disubmit. Lanjutkan?")) return;
    setSubmitLoading(true);
    setError("");
    try {
      await submitTahap1(territoryId);
      await fetchAll(territoryId);
    } catch (e: any) {
      setError(e.message || "Gagal submit tahap 1");
    } finally { setSubmitLoading(false); }
  };

  const totalAtlet    = entries.reduce((s, e) => s + e.total_atlet, 0);
  const totalPelatih  = entries.reduce((s, e) => s + e.pelatih, 0);
  const totalPersonel = entries.reduce((s, e) => s + e.total_personel, 0);

  // Nama kontingen untuk nama file export
  const kontigenName = isSuperAdmin
    ? (currentTerritory?.name ?? "kontingen")
    : (user?.name ?? "kontingen");

  const handleExportPDF = () =>
    exportTahap1PDF(kontigenName, territoryId);

  const handleExportExcel = () =>
    exportTahap1Excel(kontigenName, territoryId);

  /* ── Superadmin belum pilih territory ───────────────── */
  if (isSuperAdmin && !currentTerritory) {
    return (
      <>
        <PageMeta title="Tahap I: Entry By Sport" description="Pendaftaran cabang olahraga kontingen" />
        <PageBreadcrumb pageTitle="Tahap I: Entry By Sport" />
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
      <PageMeta title="Tahap I: Entry By Sport" description="Pendaftaran cabang olahraga kontingen" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Tahap I: Entry By Sport" />

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
          <div className="flex items-center gap-3 flex-wrap">
            {!loading && entries.length > 0 && (
              <ExportButtons
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
              />
            )}
            {!loading && <StatusBadge status={tahap1Status} />}
            {!loading && canReset && (
              <ResetTahapButton tahap={1} onReset={handleReset} />
            )}
          </div>
        </div>

        {/* Banner tahap tutup — tampil ke admin saat superadmin belum buka tahap */}
        {!loading && tahapTutup && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-900/20 px-5 py-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                  Tahap 1 belum dibuka
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
                  {pengaturan?.tanggal_buka
                    ? `Pendaftaran akan dibuka pada ${new Date(pengaturan.tanggal_buka).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.`
                    : "Hubungi panitia untuk informasi jadwal pendaftaran."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Banner validasi dari panitia */}
        {!loading && isSubmitted && validasiStatus === "REVISI" && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-900/20 px-5 py-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Data Tahap 1 perlu direvisi</p>
                {validasiCatatan && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
                    Catatan panitia: <em>"{validasiCatatan}"</em>
                  </p>
                )}
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">Silakan perbaiki data dan submit ulang.</p>
              </div>
            </div>
          </div>
        )}
        {!loading && isSubmitted && validasiStatus === "PENDING" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800/40 dark:bg-blue-900/20 px-5 py-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700 dark:text-blue-400">Tahap 1 sedang menunggu validasi dari panitia.</p>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20 px-5 py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Memuat data{currentTerritory ? ` ${currentTerritory.name}` : ""}...
            </span>
          </div>
        ) : (
          <>
            {/* Tabel cabor terdaftar */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Cabor Terdaftar
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 text-xs font-bold">
                    {entries.length}
                  </span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Cabang olahraga yang sudah dipilih kontingen</p>
              </div>

              {entries.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                  Belum ada cabor terdaftar.{canEdit && " Tambah dari daftar di bawah."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      <tr>
                        <th className="px-5 py-3 text-left font-semibold">Cabor</th>
                        <th className="px-4 py-3 text-center font-semibold">Putra</th>
                        <th className="px-4 py-3 text-center font-semibold">Putri</th>
                        <th className="px-4 py-3 text-center font-semibold">Pelatih</th>
                        <th className="px-4 py-3 text-center font-semibold">Total Atlet</th>
                        <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {entries.map(entry => (
                        <tr key={entry.cabor_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-800 dark:text-white">{entry.nama}</td>
                          <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400 font-semibold">{entry.putra}</td>
                          <td className="px-4 py-3 text-center text-pink-600 dark:text-pink-400 font-semibold">{entry.putri}</td>
                          <td className="px-4 py-3 text-center text-purple-600 dark:text-purple-400 font-semibold">{entry.pelatih}</td>
                          <td className="px-4 py-3 text-center font-bold text-gray-800 dark:text-white">{entry.total_atlet}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openViewEdit(entry, "view")}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200/70 dark:border-blue-800/40 transition-colors" title="Lihat">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              {canEdit && can("trx_kontingen_cabor.update") && (
                                <button onClick={() => openViewEdit(entry, "edit")}
                                  className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg border border-green-200/70 dark:border-green-800/40 transition-colors" title="Edit">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              )}
                              {canEdit && can("trx_kontingen_cabor.delete") && (
                                <button onClick={() => handleDelete(entry.cabor_id, entry.nama)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg border border-red-200/70 dark:border-red-800/40 transition-colors" title="Hapus">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {entries.length > 0 && (
                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Atlet: <strong className="ml-1">{totalAtlet}</strong>
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    Pelatih: <strong className="ml-1">{totalPelatih}</strong>
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                    Total Personel: <strong className="ml-1">{totalPersonel}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Tambah Cabor */}
            {canEdit && can("trx_kontingen_cabor.create") && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Tambah Cabor</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Klik cabor untuk menambahkan ke daftar kontingen</p>
                </div>
                <div className="p-5">
                  {availableCabor.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Semua cabor sudah dipilih.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {availableCabor.map(cabor => (
                        <button key={cabor.id} onClick={() => openAdd(cabor)}
                          className="px-3 py-2.5 text-sm text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 dark:hover:border-brand-600 transition-colors text-gray-700 dark:text-gray-300">
                          <span className="font-medium block">{cabor.nama}</span>
                          <span className="text-xs text-gray-400">Max: {cabor.max_putra}P / {cabor.max_putri}Pr</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit */}
            {canSubmit && (
              <div className="flex justify-end">
                <button onClick={handleSubmit} disabled={submitLoading}
                  className="px-6 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitLoading ? "Menyimpan..." : "Submit Tahap 1"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {activeEntry && (
        <CaborEntryModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          entry={activeEntry}
          onSave={handleModalSave}
        />
      )}
    </>
  );
}
