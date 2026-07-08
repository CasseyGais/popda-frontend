import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { useAuth } from "../../../context/AuthContext";
import { useTerritory } from "../../../context/TerritoryContext";
import {
  getAtlets, getPelatihs, getOfficials,
  deleteAtlet, deletePelatih, deleteOfficial,
  getTahap3Status, submitTahap3, resetTahap3,
  MasterAtlet, MasterPelatih, MasterOfficial, Tahap3Status,
} from "../service";
import { pengaturanTahapService, PengaturanTahap } from "../../PengaturanTahap/service";
import { kontingenService, Kontingen } from "../../Identitas/service";
import { getTahap2 } from "../../Bynumber/service";
import AtletModal from "../components/AtletModal";
import PelatihModal from "../components/PelatihModal";
import OfficialModal from "../components/OfficialModal";
import TrxModal from "../components/TrxModal";
import ExportButtons from "../../../components/ui/ExportButtons";
import { exportTahap3PDF, exportTahap3Excel } from "../../../utils/exportHelper";
import { ResetTahapButton } from "../../../components/popda/ResetTahapButton";

// ─── Types & helpers ──────────────────────────────────────

type Tab = "atlet" | "pelatih" | "official";
type ModalMode = "create" | "edit" | "view";
type TrxType = "atlet" | "pelatih" | "official";

/** Badge status DRAFT / SUBMITTED */
function StatusBadge({ label, status }: { label?: string; status: "DRAFT" | "SUBMITTED" }) {
  if (status === "SUBMITTED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/40">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        {label ? `${label}: SUBMITTED` : "SUBMITTED"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/40">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
      {label ? `${label}: DRAFT` : "DRAFT"}
    </span>
  );
}

/** Card info kontingen — dihapus, tidak ditampilkan di UI */

function JKBadge({ jk }: { jk: "L" | "P" }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium
      ${jk === "L" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                   : "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"}`}>
      {jk === "L" ? "L" : "P"}
    </span>
  );
}

// ─── Action buttons ───────────────────────────────────────

function RowActions({ onView, onEdit, onDelete, onDaftar }: {
  onView?: () => void; onEdit?: () => void; onDelete?: () => void; onDaftar?: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {onView && (
        <button type="button" onClick={onView}
          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200/70 dark:border-blue-800/40 transition-colors" title="Lihat">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      )}
      {onEdit && (
        <button type="button" onClick={onEdit}
          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg border border-green-200/70 dark:border-green-800/40 transition-colors" title="Edit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}
      {onDaftar && (
        <button type="button" onClick={onDaftar}
          className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg border border-purple-200/70 dark:border-purple-800/40 transition-colors" title="Daftarkan ke kompetisi">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={onDelete}
          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg border border-red-200/70 dark:border-red-800/40 transition-colors" title="Hapus">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function MainPage() {
  const { user, can }          = useAuth();
  const { currentTerritory }   = useTerritory();

  /**
   * Sesuai TAHAP3_DOCUMENTATION.md:
   * - isSuperAdmin: gunakan can("*") — bukan cek role name
   * - territoryId: superadmin ambil dari currentTerritory.id, admin biasa undefined
   * - Backend resolve kontingen_id:
   *   - Admin biasa → dari JWT claims.KontingenID
   *   - Superadmin → dari ?territory_id=X → SELECT id FROM kontingen WHERE territory_id=X
   */
  const isSuperAdmin = can("*");
  const navigate     = useNavigate();
  const territoryId  = isSuperAdmin ? currentTerritory?.id : undefined;

  const [activeTab, setActiveTab]   = useState<Tab>("atlet");
  const [atlets, setAtlets]         = useState<MasterAtlet[]>([]);
  const [pelatihs, setPelatihs]     = useState<MasterPelatih[]>([]);
  const [officials, setOfficials]   = useState<MasterOfficial[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [tahap3Status, setTahap3Status] = useState<Tahap3Status>("DRAFT");
  const [validasiStatus, setValidasiStatus] = useState<"PENDING" | "VALID" | "REVISI" | null>(null);
  const [validasiCatatan, setValidasiCatatan] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pengaturan, setPengaturan] = useState<PengaturanTahap | null>(null);

  const [kontingen, setKontingen]   = useState<Kontingen | null>(null);

  // Modal state
  const [modalOpen, setModalOpen]   = useState(false);
  const [modalMode, setModalMode]   = useState<ModalMode>("create");
  const [selectedAtlet, setSelectedAtlet]     = useState<MasterAtlet | null>(null);
  const [selectedPelatih, setSelectedPelatih] = useState<MasterPelatih | null>(null);
  const [selectedOfficial, setSelectedOfficial] = useState<MasterOfficial | null>(null);

  // Transaksi modal state
  const [trxOpen, setTrxOpen]   = useState(false);
  const [trxType, setTrxType]   = useState<TrxType>("atlet");
  const [trxPerson, setTrxPerson] = useState<MasterAtlet | MasterPelatih | MasterOfficial | null>(null);

  // ── Fetch kontingen info (superadmin only) ────────────
  const fetchKontingen = useCallback(async (tid: number) => {
    try {
      const res = await kontingenService.getByTerritoryId(tid);
      setKontingen(res.data ?? null);
    } catch {
      setKontingen(null);
    }
  }, []);

  // ── Fetch atlet/pelatih/official + status tahap3 ──────
  const fetchAll = useCallback(async (tid: number | undefined) => {
    setLoading(true);
    setError("");
    try {
      // Cek tahap2 status terlebih dahulu — jika DRAFT, arahkan ke tahap 2
      const tahap2Res = await getTahap2(tid);
      if (tahap2Res.data?.tahap2_status !== "SUBMITTED") {
        setError("tahap2_belum_submit");
        setLoading(false);
        return;
      }

      const [aRes, pRes, oRes, statusRes, pengaturanList] = await Promise.all([
        getAtlets(tid),
        getPelatihs(tid),
        getOfficials(tid),
        getTahap3Status(tid),
        pengaturanTahapService.getAll(),
      ]);
      setAtlets(aRes.data || []);
      setPelatihs(pRes.data || []);
      setOfficials(oRes.data || []);
      setTahap3Status(statusRes.tahap3_status);
      setValidasiStatus(statusRes.tahap3_validasi_status);
      setValidasiCatatan(statusRes.tahap3_validasi_catatan);
      setPengaturan(pengaturanTahapService.getByTahap(pengaturanList, 3));
    } catch (e: any) {
      const msg: string = e.message || "Gagal memuat data";
      const status = e?.response?.status ?? 0;
      // 400 dari backend = tahap 2 belum submit
      if (status === 400 || msg.toLowerCase().includes("tahap 2") || msg.toLowerCase().includes("tahap2")) {
        setError("tahap2_belum_submit");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Superadmin: tunggu territory dipilih dulu
    if (isSuperAdmin && !currentTerritory?.id) return;

    if (isSuperAdmin && currentTerritory?.id) {
      // Fetch kontingen info paralel dengan fetch data
      fetchKontingen(currentTerritory.id);
    } else {
      // Admin biasa: tidak perlu info kontingen (sudah ada di JWT)
      setKontingen(null);
    }

    fetchAll(territoryId);
  }, [isSuperAdmin, currentTerritory?.id, fetchAll, fetchKontingen, territoryId]);

  // ── Delete handlers ───────────────────────────────────
  const handleDeleteAtlet = async (id: number, nama: string) => {
    if (!confirm(`Hapus atlet "${nama}"? Data tidak dapat dikembalikan.`)) return;
    try {
      await deleteAtlet(id, territoryId);
      setAtlets(prev => prev.filter(a => a.id !== id));
    } catch (e: any) { alert("Gagal: " + (e.message || "Error")); }
  };

  const handleDeletePelatih = async (id: number, nama: string) => {
    if (!confirm(`Hapus pelatih "${nama}"?`)) return;
    try {
      await deletePelatih(id, territoryId);
      setPelatihs(prev => prev.filter(p => p.id !== id));
    } catch (e: any) { alert("Gagal: " + (e.message || "Error")); }
  };

  const handleDeleteOfficial = async (id: number, nama: string) => {
    if (!confirm(`Hapus official "${nama}"?`)) return;
    try {
      await deleteOfficial(id, territoryId);
      setOfficials(prev => prev.filter(o => o.id !== id));
    } catch (e: any) { alert("Gagal: " + (e.message || "Error")); }
  };

  // ── Modal openers ──────────────────────────────────────
  const openAtlet = (mode: ModalMode, data: MasterAtlet | null = null) => {
    setSelectedAtlet(data);
    setModalMode(mode);
    setActiveTab("atlet");
    setModalOpen(true);
  };

  const openPelatih = (mode: ModalMode, data: MasterPelatih | null = null) => {
    setSelectedPelatih(data);
    setModalMode(mode);
    setActiveTab("pelatih");
    setModalOpen(true);
  };

  const openOfficial = (mode: ModalMode, data: MasterOfficial | null = null) => {
    setSelectedOfficial(data);
    setModalMode(mode);
    setActiveTab("official");
    setModalOpen(true);
  };

  const openTrx = (type: TrxType, person: MasterAtlet | MasterPelatih | MasterOfficial) => {
    setTrxType(type);
    setTrxPerson(person);
    setTrxOpen(true);
  };

  const handleSubmit = async () => {
    if (!confirm("Data tidak dapat diubah setelah disubmit. Lanjutkan?")) return;
    setSubmitLoading(true);
    setError("");
    try {
      await submitTahap3(territoryId);
      await fetchAll(territoryId);
      // Refresh kontingen untuk update status tahap3
      if (isSuperAdmin && currentTerritory?.id) fetchKontingen(currentTerritory.id);
    } catch (e: any) {
      setError(e.message || "Gagal submit tahap 3");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Nama kontingen untuk export file
  const kontigenName = isSuperAdmin
    ? (currentTerritory?.name ?? kontingen?.nama_kontingen ?? "kontingen")
    : (user?.name ?? "kontingen");

  const hasData = atlets.length > 0 || pelatihs.length > 0 || officials.length > 0;
  const tahapTutup = !isSuperAdmin && pengaturan !== null && !pengaturan.is_open;
  // Superadmin selalu bisa CRUD, admin biasa dibatasi oleh status dan tahap
  const canEdit = isSuperAdmin || (tahap3Status !== "SUBMITTED" && !tahapTutup);
  // Superadmin bisa reset ke DRAFT kapan saja data sudah SUBMITTED
  const canReset = isSuperAdmin && tahap3Status === "SUBMITTED";

  const handleReset = async () => {
    await resetTahap3(territoryId!);
    await fetchAll(territoryId);
    if (isSuperAdmin && currentTerritory?.id) fetchKontingen(currentTerritory.id);
  };

  const handleExportPDF   = () => exportTahap3PDF(kontigenName, territoryId);
  const handleExportExcel = () => exportTahap3Excel(kontigenName, territoryId);

  // ── Superadmin gate — belum pilih territory ───────────
  if (isSuperAdmin && !currentTerritory) {
    return (
      <>
        <PageMeta title="Tahap III: Entry By Name" description="Pendaftaran atlet, pelatih & official" />
        <PageBreadcrumb pageTitle="Tahap III: Entry By Name" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Pilih wilayah dari selector di atas untuk melihat data.
          </p>
        </div>
      </>
    );
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <>
      <PageMeta title="Tahap III: Entry By Name" description="Pendaftaran atlet, pelatih & official" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Tahap III: Entry By Name" />

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            {isSuperAdmin && currentTerritory && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{currentTerritory.name}</p>
            )}
            {!isSuperAdmin && user?.name && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {!loading && error !== "tahap2_belum_submit" && (
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  Atlet: {atlets.length}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  Pelatih: {pelatihs.length}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                  Official: {officials.length}
                </span>
              </div>
            )}
            {!loading && error !== "tahap2_belum_submit" && hasData && (
              <ExportButtons onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
            )}
            {!loading && <StatusBadge status={tahap3Status} />}
            {!loading && canReset && (
              <ResetTahapButton tahap={3} onReset={handleReset} />
            )}
          </div>
        </div>


        {/* Banner tahap tutup */}
        {!loading && tahapTutup && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-900/20 px-5 py-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Tahap 3 belum dibuka</p>
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
        {!loading && tahap3Status === "SUBMITTED" && validasiStatus === "REVISI" && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-800/40 dark:bg-yellow-900/20 px-5 py-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Data Tahap 3 perlu direvisi</p>
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
        {!loading && tahap3Status === "SUBMITTED" && validasiStatus === "PENDING" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800/40 dark:bg-blue-900/20 px-5 py-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700 dark:text-blue-400">Tahap 3 sedang menunggu validasi dari panitia.</p>
          </div>
        )}

        {/* Tahap 2 belum disubmit → navigasi card */}
        {error === "tahap2_belum_submit" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tahap 2 belum diisi</p>
              <p className="text-xs text-gray-400 mt-1">Selesaikan Entry By Number terlebih dahulu sebelum mendaftarkan atlet per nama.</p>
            </div>
            <button
              onClick={() => navigate("/atlet-by-numbers")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Mulai Tahap II: Entry By Number
            </button>
          </div>
        )}

        {error && error !== "tahap2_belum_submit" && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20 px-5 py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Tabs — hanya tampil jika tidak sedang error tahap2 */}
        {error !== "tahap2_belum_submit" && (
        <div className="flex items-end justify-between border-b border-gray-200 dark:border-gray-700">
          {/* Tabs */}
          <div className="flex gap-1">
            {(["atlet", "pelatih", "official"] as Tab[]).map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className={[
                  "px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
                  activeTab === tab
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                ].join(" ")}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {!loading && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    {tab === "atlet" ? atlets.length : tab === "pelatih" ? pelatihs.length : officials.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tombol Tambah — sejajar kanan, muncul sesuai tab aktif */}
          {!loading && canEdit && (
            <div className="pb-1">
              {activeTab === "atlet" && can("trx_pendaftaran_atlet.create") && (
                <button type="button" onClick={() => openAtlet("create")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Atlet
                </button>
              )}
              {activeTab === "pelatih" && can("master_pelatih.create") && (
                <button type="button" onClick={() => openPelatih("create")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Pelatih
                </button>
              )}
              {activeTab === "official" && can("master_official.create") && (
                <button type="button" onClick={() => openOfficial("create")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Official
                </button>
              )}
            </div>
          )}
        </div>
        )}

        {error !== "tahap2_belum_submit" && (loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Memuat data{currentTerritory ? ` ${currentTerritory.name}` : ""}...
            </span>
          </div>
        ) : (
          <>

            {/* ── TAB: ATLET ── */}
            {activeTab === "atlet" && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  {atlets.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-400">Belum ada atlet. Klik Tambah Atlet untuk memulai.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          <tr>
                            <th className="px-4 py-3 text-left">No</th>
                            <th className="px-4 py-3 text-left">Nama Lengkap</th>
                            <th className="px-4 py-3 text-center">JK</th>
                            <th className="px-4 py-3 text-left">NISN</th>
                            <th className="px-4 py-3 text-left">Sekolah</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                          {atlets.map((a, i) => (
                            <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{i + 1}</td>
                              <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{a.nama_lengkap}</td>
                              <td className="px-4 py-3 text-center"><JKBadge jk={a.jenis_kelamin} /></td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.nisn}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[160px] truncate">{a.sekolah}</td>
                              <td className="px-4 py-3">
                                <RowActions
                                  onView={() => openAtlet("view", a)}
                                  onEdit={canEdit && can("trx_pendaftaran_atlet.update") ? () => openAtlet("edit", a) : undefined}
                                  onDaftar={canEdit && can("trx_pendaftaran_atlet.create") ? () => openTrx("atlet", a) : undefined}
                                  onDelete={canEdit && can("trx_pendaftaran_atlet.delete") ? () => handleDeleteAtlet(a.id, a.nama_lengkap) : undefined}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB: PELATIH ── */}
            {activeTab === "pelatih" && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  {pelatihs.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-400">Belum ada pelatih.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          <tr>
                            <th className="px-4 py-3 text-left">No</th>
                            <th className="px-4 py-3 text-left">Nama Lengkap</th>
                            <th className="px-4 py-3 text-center">JK</th>
                            <th className="px-4 py-3 text-left">Jabatan</th>
                            <th className="px-4 py-3 text-left">No. HP</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                          {pelatihs.map((p, i) => (
                            <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{i + 1}</td>
                              <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{p.nama_lengkap}</td>
                              <td className="px-4 py-3 text-center"><JKBadge jk={p.jenis_kelamin} /></td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.jabatan || "—"}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.no_hp}</td>
                              <td className="px-4 py-3">
                                <RowActions
                                  onView={() => openPelatih("view", p)}
                                  onEdit={canEdit && can("master_pelatih.update") ? () => openPelatih("edit", p) : undefined}
                                  onDaftar={canEdit && can("trx_pendaftaran_pelatih.create") ? () => openTrx("pelatih", p) : undefined}
                                  onDelete={canEdit && can("master_pelatih.delete") ? () => handleDeletePelatih(p.id, p.nama_lengkap) : undefined}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB: OFFICIAL ── */}
            {activeTab === "official" && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  {officials.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-400">Belum ada official.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          <tr>
                            <th className="px-4 py-3 text-left">No</th>
                            <th className="px-4 py-3 text-left">Nama Lengkap</th>
                            <th className="px-4 py-3 text-center">JK</th>
                            <th className="px-4 py-3 text-left">Jabatan</th>
                            <th className="px-4 py-3 text-left">No. HP</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                          {officials.map((o, i) => (
                            <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{i + 1}</td>
                              <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{o.nama_lengkap}</td>
                              <td className="px-4 py-3 text-center"><JKBadge jk={o.jenis_kelamin} /></td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{o.jabatan}</td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{o.no_hp}</td>
                              <td className="px-4 py-3">
                                <RowActions
                                  onView={() => openOfficial("view", o)}
                                  onEdit={canEdit && can("master_official.update") ? () => openOfficial("edit", o) : undefined}
                                  onDaftar={canEdit && can("trx_pendaftaran_official.create") ? () => openTrx("official", o) : undefined}
                                  onDelete={canEdit && can("master_official.delete") ? () => handleDeleteOfficial(o.id, o.nama_lengkap) : undefined}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ))}

        {/* Submit Tahap 3 — tampil saat DRAFT/null, ada data, dan tahap terbuka */}
        {!loading && error !== "tahap2_belum_submit" && (tahap3Status === "DRAFT" || (tahap3Status as string | null) === null) && hasData && !tahapTutup && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitLoading}
              className="px-6 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLoading ? "Menyimpan..." : "Submit Tahap 3"}
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AtletModal
        isOpen={modalOpen && activeTab === "atlet"}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        data={selectedAtlet}
        territoryId={territoryId}
        onSuccess={_a => {
          // Re-fetch penuh agar data sesuai territory yang aktif
          fetchAll(territoryId);
        }}
      />
      <PelatihModal
        isOpen={modalOpen && activeTab === "pelatih"}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        data={selectedPelatih}
        territoryId={territoryId}
        onSuccess={() => {
          fetchAll(territoryId);
        }}
      />
      <OfficialModal
        isOpen={modalOpen && activeTab === "official"}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        data={selectedOfficial}
        territoryId={territoryId}
        onSuccess={() => {
          fetchAll(territoryId);
        }}
      />

      {/* Transaksi pendaftaran — atlet ke nomor, pelatih ke cabor, official */}
      {trxPerson && (
        <TrxModal
          isOpen={trxOpen}
          onClose={() => setTrxOpen(false)}
          type={trxType}
          person={trxPerson}
          territoryId={territoryId}
        />
      )}
    </>
  );
}
