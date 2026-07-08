import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { useAuth } from "../../../context/AuthContext";
import {
  sertifikatService,
  type Sertifikat,
  type TipePenerima,
  type TTDSertifikat,
} from "../service";
import SertifikatModal from "../components/SertifikatModal";
import ExportTTDModal from "../components/ExportTTDModal";
type ModalMode = "create" | "edit" | "view";

// ─── Badge tipe penerima ──────────────────────────────────

const TIPE_COLOR: Record<TipePenerima, string> = {
  ATLET:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PELATIH:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  OFFICIAL: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

// ─── Main Page ────────────────────────────────────────────

export default function MainPage() {
  const { can } = useAuth();

  // Guard — ADMIN kontingen (role 2) tidak bisa akses, hanya superadmin & staff_lapangan
  const hasAccess = can("*") || can("sertifikat.read");
  if (!hasAccess) {
    return <Navigate to="/403" replace />;
  }

  const [list, setList]           = useState<Sertifikat[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [filterTipe, setFilterTipe] = useState<TipePenerima | "">("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selected, setSelected]   = useState<Sertifikat | null>(null);

  // ── Fetch ─────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await sertifikatService.getAll(
        filterTipe ? { tipe: filterTipe } : undefined
      );
      setList(data);
    } catch (e: any) {
      setError(e.message || "Gagal memuat data sertifikat");
    } finally {
      setLoading(false);
    }
  }, [filterTipe]);

  useEffect(() => { fetchList(); }, [fetchList]);

  // ── Delete ────────────────────────────────────────────
  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Hapus sertifikat "${nama}"? Data tidak dapat dikembalikan.`)) return;
    try {
      await sertifikatService.delete(id);
      setList(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      alert("Gagal: " + (e.message || "Error"));
    }
  };

  // ── Modal openers ─────────────────────────────────────
  const openCreate = () => {
    setSelected(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEdit = (s: Sertifikat) => {
    setSelected(s);
    setModalMode("edit");
    setModalOpen(true);
  };

  const openView = (s: Sertifikat) => {
    setSelected(s);
    setModalMode("view");
    setModalOpen(true);
  };

  // ── Format tanggal ────────────────────────────────────
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

  // ── Export handlers ───────────────────────────────────
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [exportingBatch, setExportingBatch] = useState(false);

  // Modal TTD
  const [ttdModalOpen, setTtdModalOpen]     = useState(false);
  const [ttdTarget, setTtdTarget]           = useState<Sertifikat | null>(null); // null = batch

  // Quick export tanpa TTD
  const handleExportPDF = async (s: Sertifikat) => {
    setExportingId(s.id);
    try {
      await sertifikatService.exportPDF(s.id, s.nama_penerima, []);
    } catch (e: any) {
      alert("Gagal export PDF: " + (e.message || "Error"));
    } finally {
      setExportingId(null);
    }
  };

  // Export dengan TTD — buka modal dulu
  const openExportDenganTTD = (s: Sertifikat) => {
    setTtdTarget(s);
    setTtdModalOpen(true);
  };

  // Export batch dengan TTD — buka modal tanpa target
  const openExportBatch = () => {
    setTtdTarget(null);
    setTtdModalOpen(true);
  };

  // Callback dari ExportTTDModal setelah TTD dikonfirmasi
  const handleDoExport = async (ttds: TTDSertifikat[]) => {
    if (ttdTarget) {
      // Export satu sertifikat
      setExportingId(ttdTarget.id);
      try {
        await sertifikatService.exportPDF(ttdTarget.id, ttdTarget.nama_penerima, ttds);
      } catch (e: any) {
        alert("Gagal export PDF: " + (e.message || "Error"));
      } finally {
        setExportingId(null);
      }
    } else {
      // Export batch
      setExportingBatch(true);
      try {
        await sertifikatService.exportBatchPDF(filterTipe || undefined, ttds);
      } catch (e: any) {
        alert("Gagal export batch: " + (e.message || "Error"));
      } finally {
        setExportingBatch(false);
      }
    }
  };

  return (
    <>
      <PageMeta title="Sertifikat" description="Kelola piagam penghargaan POPDA" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Sertifikat" />

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {/* Filter tipe */}
            <select
              value={filterTipe}
              onChange={e => setFilterTipe(e.target.value as TipePenerima | "")}
              className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-700 dark:text-gray-300"
            >
              <option value="">Semua Tipe</option>
              <option value="ATLET">Atlet</option>
              <option value="PELATIH">Pelatih</option>
              <option value="OFFICIAL">Official</option>
            </select>
          </div>

          {/* Tombol aksi — Export kiri, Buat Sertifikat kanan */}
          <div className="flex items-center gap-2">
            {list.length > 0 && (
              <button
                type="button"
                onClick={openExportBatch}
                disabled={exportingBatch}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-200 dark:border-brand-800/40 text-brand-600 dark:text-brand-400 text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {exportingBatch ? "Membuat PDF..." : `Export Batch PDF${filterTipe ? ` (${filterTipe})` : ""}`}
              </button>
            )}
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Buat Sertifikat
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20 px-5 py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Tabel */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Memuat data...</span>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
            {list.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-400">
                Belum ada sertifikat.{" "}
                <button onClick={openCreate} className="text-brand-500 hover:underline">Buat sekarang</button>
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">No</th>
                      <th className="px-4 py-3 text-left">Tipe</th>
                      <th className="px-4 py-3 text-left">Nama Penerima</th>
                      <th className="px-4 py-3 text-left">Judul</th>
                      <th className="px-4 py-3 text-left">Nomor</th>
                      <th className="px-4 py-3 text-left">Tanggal Terbit</th>
                      <th className="px-4 py-3 text-center">File</th>
                      <th className="px-4 py-3 text-center">Export</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {list.map((s, i) => (
                      <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TIPE_COLOR[s.tipe_penerima]}`}>
                            {s.tipe_penerima}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{s.nama_penerima}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[200px] truncate">{s.judul}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.nomor_sertifikat || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{fmtDate(s.tanggal_terbit)}</td>
                        <td className="px-4 py-3 text-center">
                          {s.file_sertifikat ? (
                            <a
                              href={s.file_sertifikat}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              PDF
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        {/* Export PDF per baris */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Quick export tanpa TTD */}
                            <button
                              type="button"
                              onClick={() => handleExportPDF(s)}
                              disabled={exportingId === s.id}
                              title="Export PDF (tanpa tanda tangan)"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              {exportingId === s.id ? "..." : "PDF"}
                            </button>
                            {/* Export dengan TTD */}
                            <button
                              type="button"
                              onClick={() => openExportDenganTTD(s)}
                              title="Export PDF dengan tanda tangan"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              + TTD
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openView(s)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200/70 dark:border-blue-800/40 transition-colors"
                              title="Lihat"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => openEdit(s)}
                              className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg border border-green-200/70 dark:border-green-800/40 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(s.id, s.nama_penerima)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg border border-red-200/70 dark:border-red-800/40 transition-colors"
                              title="Hapus"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      <SertifikatModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        data={selected}
        onSuccess={result => {
          if (modalMode === "create") {
            setList(prev => [result, ...prev]);
          } else {
            setList(prev => prev.map(s => s.id === result.id ? result : s));
          }
        }}
      />

      {/* Modal Export + TTD */}
      <ExportTTDModal
        isOpen={ttdModalOpen}
        onClose={() => setTtdModalOpen(false)}
        target={ttdTarget}
        filterTipe={filterTipe || undefined}
        onExport={handleDoExport}
      />
    </>
  );
}
