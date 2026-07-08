import { useState, useEffect, useCallback } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { useAuth } from "../../../context/AuthContext";
import {
  laporanPertandinganService,
  formatTanggalIndo,
  getBabakLabel,
  getPemenangLabel,
  type LaporanDetail,
  type LaporanFilter,
  type Babak,
  type Pemenang,
  type CaborDropdownItem,
  BABAK_OPTIONS,
  PEMENANG_OPTIONS,
} from "../service";
import LaporanModal from "../components/LaporanModal";
import ExportPDFModal from "../components/ExportPDFModal";

type ModalMode = "create" | "edit" | "view";

// ─── Badge color helpers ──────────────────────────────────

const BABAK_COLOR: Record<string, string> = {
  PENYISIHAN:         "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  "8_BESAR":          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PEREMPAT_FINAL:     "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  SEMIFINAL:          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  FINAL:              "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PEREBUTAN_TEMPAT_3: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  LAINNYA:            "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const PEMENANG_COLOR: Record<string, string> = {
  TIM_A: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  TIM_B: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  DRAW:  "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

const babakColor = (v: string) =>
  BABAK_COLOR[v?.toUpperCase()] ?? "bg-gray-100 text-gray-500";

const pemenangColor = (v: string) =>
  PEMENANG_COLOR[v?.toUpperCase()] ?? "bg-gray-100 text-gray-500";

// ─── Main Page ────────────────────────────────────────────

export default function MainPage() {
  const { can } = useAuth();

  // Permission granular — SUPERADMIN (can("*")) bypass semua
  // STAFF_LAPANGAN perlu permission eksplisit dari backend
  // ADMIN yang tidak punya permission ini hanya bisa view + download PDF
  const canCreate = can("*") || can("laporan_pertandingan.create");
  const canUpdate = can("*") || can("laporan_pertandingan.update");
  const canDelete = can("*") || can("laporan_pertandingan.delete");
  const canSign   = can("*") || can("laporan_pertandingan.sign");

  const [list, setList]       = useState<LaporanDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Dropdown cabor untuk filter bar
  const [caborDropdown, setCaborDropdown] = useState<CaborDropdownItem[]>([]);

  // Filter
  const [filterTanggal, setFilterTanggal]   = useState("");
  const [filterCaborId, setFilterCaborId]   = useState<number | "">("");
  const [filterBabak, setFilterBabak]       = useState<Babak | "">("");
  const [filterPemenang, setFilterPemenang] = useState<Pemenang | "">("");

  // Modal CRUD
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selected, setSelected]   = useState<LaporanDetail | null>(null);

  // Modal export PDF + TTD
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportTarget, setExportTarget]       = useState<LaporanDetail | null>(null);

  // Quick export (tanpa TTD)
  const [exportingId, setExportingId] = useState<number | null>(null);

  // ── Fetch list ────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    const filters: LaporanFilter = {};
    if (filterTanggal)        filters.tanggal  = filterTanggal;
    if (filterCaborId !== "") filters.cabor_id = Number(filterCaborId);
    if (filterBabak)          filters.babak    = filterBabak;
    if (filterPemenang)       filters.pemenang = filterPemenang;
    try {
      const data = await laporanPertandinganService.getAll(
        Object.keys(filters).length ? filters : undefined
      );
      setList(data);
    } catch (e: any) {
      // 500 dari backend (biasanya karena belum ada data / JOIN issue) —
      // tampilkan halaman kosong saja, jangan error banner. Log ke console.
      const status = e?.response?.status ?? 0;
      if (status === 500 || e?.message?.includes("500")) {
        console.warn("[LaporanPertandingan] GET 500:", e.message);
        setList([]);
      } else {
        setError(e.message || "Gagal memuat data laporan pertandingan");
      }
    } finally {
      setLoading(false);
    }
  }, [filterTanggal, filterCaborId, filterBabak, filterPemenang]);

  useEffect(() => { fetchList(); }, [fetchList]);

  // Load dropdown cabor sekali saat mount
  useEffect(() => {
    laporanPertandinganService.getCaborDropdown()
      .then(setCaborDropdown)
      .catch(() => {});
  }, []);

  // ── Delete ────────────────────────────────────────────
  const handleDelete = async (l: LaporanDetail) => {
    const label = `${l.nama_cabor} — ${l.nama_nomor} (${getBabakLabel(l.babak)})`;
    if (!confirm(`Hapus laporan "${label}"? Data atlet ikut terhapus dan tidak dapat dikembalikan.`)) return;
    try {
      await laporanPertandinganService.delete(l.id);
      setList(prev => prev.filter(x => x.id !== l.id));
    } catch (e: any) {
      alert("Gagal hapus: " + (e.message || "Error"));
    }
  };

  // ── Modal openers ─────────────────────────────────────
  const openCreate = () => { setSelected(null); setModalMode("create"); setModalOpen(true); };
  const openEdit   = (l: LaporanDetail) => { setSelected(l); setModalMode("edit");   setModalOpen(true); };
  const openView   = (l: LaporanDetail) => { setSelected(l); setModalMode("view");   setModalOpen(true); };
  const openExportSatu  = (l: LaporanDetail) => { setExportTarget(l);   setExportModalOpen(true); };
  const openExportBatch = ()                  => { setExportTarget(null); setExportModalOpen(true); };

  // ── Quick export satu tanpa TTD ───────────────────────
  const handleQuickExport = async (l: LaporanDetail) => {
    setExportingId(l.id);
    try {
      await laporanPertandinganService.exportSatu(l.id);
    } catch (e: any) {
      alert("Gagal export PDF: " + (e.message || "Error"));
    } finally {
      setExportingId(null);
    }
  };

  const hasFilter = filterTanggal || filterBabak || filterPemenang || filterCaborId !== "";
  const resetFilter = () => {
    setFilterTanggal(""); setFilterBabak(""); setFilterPemenang(""); setFilterCaborId("");
  };

  return (
    <>
      <PageMeta title="Laporan Pertandingan" description="Kelola laporan hasil pertandingan POPDA" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Laporan Pertandingan" />

        {/* ── Header: Filter kiri, tombol aksi kanan ── */}
        {/* ── Header: Filter kiri, tombol aksi kanan — selalu satu baris ── */}
        <div className="flex items-start justify-between gap-3">
          {/* Filter — boleh wrap ke bawah jika sempit */}
          <div className="flex flex-wrap gap-3 flex-1 min-w-0">
            <input
              type="date"
              value={filterTanggal}
              onChange={e => setFilterTanggal(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-700 dark:text-gray-300 [&::-webkit-calendar-picker-indicator]:cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:filter"
            />
            <select
              value={filterCaborId}
              onChange={e => setFilterCaborId(e.target.value ? Number(e.target.value) : "")}
              className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-700 dark:text-gray-300"
            >
              <option value="">Semua Cabor</option>
              {caborDropdown.map(c => (
                <option key={c.id} value={c.id}>{c.nama}</option>
              ))}
            </select>
            <select
              value={filterBabak}
              onChange={e => setFilterBabak(e.target.value as Babak | "")}
              className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-700 dark:text-gray-300"
            >
              <option value="">Semua Babak</option>
              {BABAK_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={filterPemenang}
              onChange={e => setFilterPemenang(e.target.value as Pemenang | "")}
              className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-700 dark:text-gray-300"
            >
              <option value="">Semua Pemenang</option>
              {PEMENANG_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {hasFilter && (
              <button
                type="button"
                onClick={resetFilter}
                className="h-9 px-3 rounded-lg text-sm text-gray-500 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Tombol aksi — pojok kanan, ditampilkan sesuai permission */}
          {(canCreate || canSign) && (
            <div className="flex gap-2 shrink-0">
              {canSign && (
                <button
                  type="button"
                  onClick={openExportBatch}
                  className="inline-flex items-center gap-2 px-4 py-2 h-9 rounded-lg border border-brand-200 dark:border-brand-800/40 text-brand-600 dark:text-brand-400 text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF Batch
                </button>
              )}
              {canCreate && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 h-9 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Laporan
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20 px-5 py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* ── Tabel ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Memuat data...</span>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
            {list.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-400">
                Belum ada laporan pertandingan.{" "}
                {canCreate && (
                  <button onClick={openCreate} className="text-brand-500 hover:underline">
                    Tambah sekarang
                  </button>
                )}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-center">No</th>
                      <th className="px-4 py-3 text-center">Tanggal</th>
                      <th className="px-4 py-3 text-center">Cabor / Nomor</th>
                      <th className="px-4 py-3 text-center">Babak</th>
                      <th className="px-4 py-3 text-center">Tim A VS Tim B</th>
                      <th className="px-4 py-3 text-center">Hasil</th>
                      <th className="px-4 py-3 text-center">Pemenang</th>
                      {canSign && <th className="px-4 py-3 text-center">PDF</th>}
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {list.map((l, i) => (
                      <tr key={l.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="px-4 py-3 text-sm text-center text-gray-400 dark:text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-600 dark:text-gray-300">{formatTanggalIndo(l.tanggal_pertandingan)}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {l.waktu_pertandingan?.slice(0, 5)} WIB
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-sm font-medium text-gray-800 dark:text-white">{l.nama_cabor}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{l.nama_nomor}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${babakColor(l.babak)}`}>
                            {getBabakLabel(l.babak)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-xs text-gray-800 dark:text-white whitespace-nowrap">{l.nama_kontingen_a}</div>
                          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 my-0.5">VS</div>
                          <div className="text-xs text-gray-800 dark:text-white whitespace-nowrap">{l.nama_kontingen_b ?? "—"}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300 max-w-[140px] truncate">
                          {l.hasil_pertandingan}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${pemenangColor(l.pemenang)}`}>
                            {getPemenangLabel(l.pemenang)}
                          </span>
                          {l.juara_ke && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                              Juara {l.juara_ke}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {canSign && (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuickExport(l)}
                                disabled={exportingId === l.id}
                                title="Export PDF tanpa tanda tangan"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                {exportingId === l.id ? "..." : "PDF"}
                              </button>
                              <button
                                type="button"
                                onClick={() => openExportSatu(l)}
                                title="Export PDF dengan tanda tangan"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                + TTD
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openView(l)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200/70 dark:border-blue-800/40 transition-colors"
                              title="Lihat Detail"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {canUpdate && (
                            <button
                              type="button"
                              onClick={() => openEdit(l)}
                              className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg border border-green-200/70 dark:border-green-800/40 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            )}
                            {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(l)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg border border-red-200/70 dark:border-red-800/40 transition-colors"
                              title="Hapus"
                            >
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
          </div>
        )}
      </div>

      {/* ── Modal CRUD ── */}
      <LaporanModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        data={selected}
        onSuccess={result => {
          if (modalMode === "create") {
            setList(prev => [result, ...prev]);
          } else {
            setList(prev => prev.map(l => l.id === result.id ? result : l));
          }
        }}
      />

      {/* ── Modal Export PDF + TTD ── */}
      <ExportPDFModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        target={exportTarget}
      />
    </>
  );
}
