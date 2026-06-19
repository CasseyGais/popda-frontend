import { useState, useEffect } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import {
  pengaturanTahapService,
  type PengaturanTahap,
  type UpdatePengaturanTahapPayload,
} from "../../PengaturanTahap/service";

const TAHAP_LABELS: Record<number, string> = {
  1: "Tahap I — Entry By Sport",
  2: "Tahap II — Entry By Number",
  3: "Tahap III — Entry By Name",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Row per tahap ────────────────────────────────────────

interface RowProps {
  setting: PengaturanTahap;
  onToggle: (tahap: 1 | 2 | 3, val: boolean) => Promise<void>;
  onSaveDates: (tahap: 1 | 2 | 3, buka: string, tutup: string) => Promise<void>;
  saving: boolean;
}

function TahapRow({ setting, onToggle, onSaveDates, saving }: RowProps) {
  const [editMode, setEditMode]       = useState(false);
  const [buka, setBuka]               = useState(setting.tanggal_buka ?? "");
  const [tutup, setTutup]             = useState(setting.tanggal_tutup ?? "");
  const [localSaving, setLocalSaving] = useState(false);

  const handleToggle = async () => {
    setLocalSaving(true);
    try {
      await onToggle(setting.tahap, !setting.is_open);
    } finally {
      setLocalSaving(false);
    }
  };

  const handleSave = async () => {
    setLocalSaving(true);
    try {
      await onSaveDates(setting.tahap, buka, tutup);
      setEditMode(false);
    } finally {
      setLocalSaving(false);
    }
  };

  const handleCancel = () => {
    setBuka(setting.tanggal_buka ?? "");
    setTutup(setting.tanggal_tutup ?? "");
    setEditMode(false);
  };

  const isBusy = saving || localSaving;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
      {/* Header baris */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white">
            {TAHAP_LABELS[setting.tahap]}
          </p>
          {!editMode && (
            <p className="text-xs text-gray-400 mt-0.5">
              {setting.tanggal_buka
                ? `${formatDate(setting.tanggal_buka)} — ${formatDate(setting.tanggal_tutup)}`
                : "Tanggal belum diset"}
            </p>
          )}
        </div>

        {/* Toggle buka/tutup */}
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs font-medium ${setting.is_open ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
            {setting.is_open ? "BUKA" : "TUTUP"}
          </span>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isBusy}
            className={[
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
              setting.is_open
                ? "bg-brand-500"
                : "bg-gray-300 dark:bg-gray-600",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
                setting.is_open ? "translate-x-6" : "translate-x-1",
              ].join(" ")}
            />
          </button>
          <button
            type="button"
            onClick={() => setEditMode(e => !e)}
            disabled={isBusy}
            className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {editMode ? "Batal Edit" : "Edit Tanggal"}
          </button>
        </div>
      </div>

      {/* Edit tanggal */}
      {editMode && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Tanggal Buka
            </label>
            <input
              type="date"
              value={buka}
              onChange={e => setBuka(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 text-sm text-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Tanggal Tutup
            </label>
            <input
              type="date"
              value={tutup}
              onChange={e => setTutup(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 text-sm text-gray-800 dark:text-white"
            />
          </div>
          <div className="sm:col-span-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={localSaving}
              className="px-4 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={localSaving}
              className="px-4 py-1.5 text-xs rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium transition-colors disabled:opacity-50"
            >
              {localSaving ? "Menyimpan..." : "Simpan Tanggal"}
            </button>
          </div>
        </div>
      )}

      {/* Last updated */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        Terakhir diubah: {new Date(setting.updated_at).toLocaleString("id-ID")}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function PengaturanTahapPage() {
  const [settings, setSettings]   = useState<PengaturanTahap[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await pengaturanTahapService.getAll();
      setSettings(data);
    } catch (e: any) {
      setError(e.message || "Gagal memuat pengaturan tahap");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (tahap: 1 | 2 | 3, val: boolean) => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updated = await pengaturanTahapService.toggle(tahap, val);
      setSettings(prev => prev.map(s => s.tahap === tahap ? updated : s));
      setSuccess(`Tahap ${tahap} berhasil ${val ? "dibuka" : "ditutup"}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message || "Gagal mengubah status tahap");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDates = async (tahap: 1 | 2 | 3, buka: string, tutup: string) => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const payload: UpdatePengaturanTahapPayload = {
        tanggal_buka:  buka  || "",
        tanggal_tutup: tutup || "",
      };
      const updated = await pengaturanTahapService.update(tahap, payload);
      setSettings(prev => prev.map(s => s.tahap === tahap ? updated : s));
      setSuccess(`Tanggal Tahap ${tahap} berhasil disimpan`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message || "Gagal menyimpan tanggal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta title="Pengaturan Tahap" description="Buka atau tutup tahap pendaftaran" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Pengaturan Tahap" />

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg">
              Atur kapan setiap tahap pendaftaran bisa diakses oleh admin kontingen.
              Toggle <strong>BUKA</strong> untuk mengaktifkan akses, <strong>TUTUP</strong> untuk memblokir.
              Tanggal bersifat informatif — kontrol utama ada di toggle.
            </p>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="px-4 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Notifikasi */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20 px-5 py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/20 px-5 py-3">
            <p className="text-sm text-green-700 dark:text-green-400">✓ {success}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Memuat pengaturan...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {settings.map(s => (
              <TahapRow
                key={s.tahap}
                setting={s}
                onToggle={handleToggle}
                onSaveDates={handleSaveDates}
                saving={saving}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
