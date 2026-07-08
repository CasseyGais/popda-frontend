import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import {
  validasiPendaftaranService,
  type ValidasiKontingen,
  type ValidasiStatus,
  type SetValidasiPayload,
} from "../../ValidasiPendaftaran/service";

// ─── Badge status validasi ────────────────────────────────

function ValidasiBadge({ status }: { status: ValidasiStatus }) {
  if (!status) return <span className="text-xs text-gray-400">—</span>;
  const cfg = {
    VALID:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    PENDING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    REVISI:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  }[status];
  const label = { VALID: "✓ Valid", PENDING: "⏳ Pending", REVISI: "⚠ Revisi" }[status];
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cfg}`}>
      {label}
    </span>
  );
}

// ─── Modal validasi ───────────────────────────────────────

interface ModalValidasiProps {
  kontingen: ValidasiKontingen;
  tahap: 1 | 2 | 3;
  onClose: () => void;
  onSaved: () => void;
}

function ModalValidasi({ kontingen, tahap, onClose, onSaved }: ModalValidasiProps) {
  const tahapData = kontingen[`tahap${tahap}` as "tahap1" | "tahap2" | "tahap3"];
  const [status, setStatus]   = useState<"VALID" | "REVISI">(
    tahapData.validasi_status === "REVISI" ? "REVISI" : "VALID"
  );
  const [catatan, setCatatan] = useState(tahapData.validasi_catatan ?? "");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const handleSave = async () => {
    if (status === "REVISI" && !catatan.trim()) {
      setError("Catatan wajib diisi untuk status REVISI"); return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: SetValidasiPayload = {
        status,
        catatan: status === "REVISI" ? catatan.trim() : null,
      };
      await validasiPendaftaranService.setValidasi(kontingen.kontingen_id, tahap, payload);
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || "Gagal menyimpan validasi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            Validasi Tahap {tahap}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{kontingen.nama_kontingen}</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20 px-4 py-2">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Status radio */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Status Validasi</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="VALID"
                checked={status === "VALID"}
                onChange={() => setStatus("VALID")}
                className="text-brand-500"
              />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">✅ VALID</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="REVISI"
                checked={status === "REVISI"}
                onChange={() => setStatus("REVISI")}
                className="text-brand-500"
              />
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">⚠ REVISI</span>
            </label>
          </div>
        </div>

        {/* Catatan — wajib saat REVISI */}
        {status === "REVISI" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Catatan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Tulis catatan revisi untuk admin kontingen..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-white resize-none"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Validasi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────

export default function ValidasiPendaftaranPage() {
  const navigate = useNavigate();
  const [list, setList]       = useState<ValidasiKontingen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Filter state
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTahap,  setFilterTahap]  = useState("");

  // Modal state
  const [modalKontingen, setModalKontingen] = useState<ValidasiKontingen | null>(null);
  const [modalTahap, setModalTahap]         = useState<1 | 2 | 3>(1);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const filters: Record<string, string | number> = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterTahap)  filters.tahap  = Number(filterTahap);
      const data = await validasiPendaftaranService.getList(filters);
      setList(data);
    } catch (e: any) {
      setError(e.message || "Gagal memuat data validasi");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterTahap]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openModal = (k: ValidasiKontingen, tahap: 1 | 2 | 3) => {
    setModalKontingen(k);
    setModalTahap(tahap);
  };

  const getTahapData = (k: ValidasiKontingen, t: 1 | 2 | 3) =>
    k[`tahap${t}` as "tahap1" | "tahap2" | "tahap3"];

  return (
    <>
      <PageMeta title="Validasi Pendaftaran" description="Review dan validasi data pendaftaran per kontingen" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Validasi Pendaftaran" />

        {/* Filter */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">⏳ Pending</option>
            <option value="VALID">✅ Valid</option>
            <option value="REVISI">⚠ Revisi</option>
          </select>

          <select
            value={filterTahap}
            onChange={e => setFilterTahap(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">Semua Tahap</option>
            <option value="1">Tahap 1</option>
            <option value="2">Tahap 2</option>
            <option value="3">Tahap 3</option>
          </select>

          <button
            onClick={fetchList}
            disabled={loading}
            className="px-4 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            ↻ Refresh
          </button>
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
              <p className="py-16 text-center text-sm text-gray-400">Tidak ada data.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3 text-left align-middle">Nama Kontingen</th>
                      <th className="px-4 py-3 text-center align-middle">Tahap 1</th>
                      <th className="px-4 py-3 text-center align-middle">Tahap 2</th>
                      <th className="px-4 py-3 text-center align-middle">Tahap 3</th>
                      <th className="px-4 py-3 text-center align-middle">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {list.map(k => (
                      <tr key={k.kontingen_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="px-5 py-4 font-medium text-gray-800 dark:text-white align-middle">
                          {k.nama_kontingen}
                        </td>
                        {([1, 2, 3] as const).map(t => {
                          const td = getTahapData(k, t);
                          return (
                            <td key={t} className="px-4 py-4 text-center align-middle">
                              {td.submit_status === "DRAFT" ? (
                                <span className="text-xs text-gray-400">— Belum submit</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openModal(k, t)}
                                  className="inline-flex items-center justify-center group"
                                  title="Klik untuk validasi"
                                >
                                  <ValidasiBadge status={td.validasi_status} />
                                </button>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-4 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => navigate(`/rekap-pendaftaran?territory_id=${k.territory_id}`)}
                            className="px-3 py-1 text-xs rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors border border-brand-200 dark:border-brand-800/40"
                          >
                            Detail
                          </button>
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

      {/* Modal validasi */}
      {modalKontingen && (
        <ModalValidasi
          kontingen={modalKontingen}
          tahap={modalTahap}
          onClose={() => setModalKontingen(null)}
          onSaved={fetchList}
        />
      )}
    </>
  );
}
