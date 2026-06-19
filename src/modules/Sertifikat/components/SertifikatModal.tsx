import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import {
  sertifikatService,
  buildCreatePayload,
  type Sertifikat,
  type TipePenerima,
  type UpdateSertifikatPayload,
  type PenerimaSingkat,
} from "../service";

// ─── Fetch daftar penerima per tipe ──────────────────────
// PENTING: pakai endpoint khusus sertifikat yang lintas semua kontingen,
// BUKAN /admin/tahap3/atlet atau /admin/master/pelatih
// karena keduanya difilter by kontingen dari JWT.

async function fetchPenerima(tipe: TipePenerima): Promise<PenerimaSingkat[]> {
  try {
    if (tipe === "ATLET")    return await sertifikatService.getAtletDropdown();
    if (tipe === "PELATIH")  return await sertifikatService.getPelatihDropdown();
    if (tipe === "OFFICIAL") return await sertifikatService.getOfficialDropdown();
  } catch { /* ignore */ }
  return [];
}

// ─── FileRow untuk upload PDF ────────────────────────────

function FileRow({
  currentPath,
  onUpload,
  uploading,
}: {
  currentPath: string | null;
  onUpload: (f: File) => Promise<void>;
  uploading: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setBusy(true);
    try { await onUpload(file); setDone(true); setFile(null); }
    finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">File PDF Sertifikat</span>
        {currentPath && !done && (
          <a href={currentPath} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline">
            Lihat
          </a>
        )}
        {done && <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Terupload</span>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept=".pdf"
          onChange={e => { setFile(e.target.files?.[0] ?? null); setDone(false); }}
          className="flex-1 text-xs text-gray-500 dark:text-gray-400
            file:mr-2 file:py-1 file:px-2 file:rounded file:border-0
            file:text-xs file:bg-gray-100 file:text-gray-700
            dark:file:bg-gray-700 dark:file:text-gray-200"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || busy || uploading}
          className="shrink-0 px-2.5 py-1 rounded bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? "..." : "Upload"}
        </button>
      </div>
      {!currentPath && !done && <p className="text-xs text-gray-400">Belum ada file PDF</p>}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  data: Sertifikat | null;
  onSuccess: (s: Sertifikat) => void;
}

const EMPTY_DATE = new Date().toISOString().slice(0, 10);

// ─── Component ───────────────────────────────────────────

export default function SertifikatModal({ isOpen, onClose, mode, data, onSuccess }: Props) {
  const isView = mode === "view";

  // Create fields
  const [tipe, setTipe]             = useState<TipePenerima>("ATLET");
  const [penerimaId, setPenerimaId] = useState<number | "">("");
  const [opsiPenerima, setOpsiPenerima] = useState<PenerimaSingkat[]>([]);
  const [opsiGrouped, setOpsiGrouped] = useState<Record<string, PenerimaSingkat[]>>({});
  const [loadingPenerima, setLoadingPenerima] = useState(false);

  // Common fields
  const [judul, setJudul]           = useState("");
  const [nomor, setNomor]           = useState("");
  const [tanggal, setTanggal]       = useState(EMPTY_DATE);
  const [catatan, setCatatan]       = useState("");

  // Upload state (edit mode)
  const [localData, setLocalData]   = useState<Sertifikat | null>(null);
  const [anyUploading, setAnyUploading] = useState(false);

  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const activeData = localData ?? data;

  // ── Load daftar penerima saat tipe berubah ────────────
  useEffect(() => {
    if (mode !== "create") return;
    setLoadingPenerima(true);
    setPenerimaId("");
    fetchPenerima(tipe)
      .then(data => {
        // Group by nama_kontingen sesuai MD
        const grouped: Record<string, PenerimaSingkat[]> = {};
        data.forEach(p => {
          if (!grouped[p.nama_kontingen]) grouped[p.nama_kontingen] = [];
          grouped[p.nama_kontingen].push(p);
        });
        setOpsiGrouped(grouped);
        setOpsiPenerima(data);
      })
      .finally(() => setLoadingPenerima(false));
  }, [tipe, mode]);

  // ── Populate form saat dibuka ─────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setLocalData(null);
    if (data && mode !== "create") {
      setJudul(data.judul);
      setNomor(data.nomor_sertifikat ?? "");
      setTanggal(data.tanggal_terbit);
      setCatatan(data.catatan ?? "");
    } else {
      setTipe("ATLET");
      setPenerimaId("");
      setJudul("");
      setNomor("");
      setTanggal(EMPTY_DATE);
      setCatatan("");
    }
  }, [isOpen, data, mode]);

  // ── Save ──────────────────────────────────────────────
  const handleSave = async () => {
    if (!judul || !tanggal) {
      setError("Judul dan tanggal terbit wajib diisi");
      return;
    }
    if (mode === "create" && !penerimaId) {
      setError("Pilih penerima sertifikat");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let result: Sertifikat;
      if (mode === "create") {
        const payload = buildCreatePayload(tipe, Number(penerimaId), {
          judul,
          nomor_sertifikat: nomor || null,
          tanggal_terbit:   tanggal,
          catatan:          catatan || null,
        });
        result = await sertifikatService.create(payload);
      } else {
        const payload: UpdateSertifikatPayload = {
          judul,
          nomor_sertifikat: nomor || null,
          tanggal_terbit:   tanggal,
          catatan:          catatan || null,
        };
        result = await sertifikatService.update(data!.id, payload);
      }
      onSuccess(result);
      onClose();
    } catch (e: any) {
      setError(e.message || "Gagal menyimpan sertifikat");
    } finally {
      setLoading(false);
    }
  };

  // ── Upload file ───────────────────────────────────────
  const handleUpload = async (file: File) => {
    const id = (localData ?? data)!.id;
    setAnyUploading(true);
    try {
      const res = await sertifikatService.uploadFile(id, file);
      setLocalData(prev => ({ ...(prev ?? data!), file_sertifikat: res.path }));
    } finally {
      setAnyUploading(false);
    }
  };

  // ── Tipe badge warna ──────────────────────────────────
  const TIPE_COLOR: Record<TipePenerima, string> = {
    ATLET:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PELATIH:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    OFFICIAL: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[560px] m-4">
      <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-5 pr-8">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
            {mode === "create" ? "Buat Sertifikat" : mode === "edit" ? "Edit Sertifikat" : "Detail Sertifikat"}
          </h4>
          {activeData && (
            <span className={`mt-1 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${TIPE_COLOR[activeData.tipe_penerima]}`}>
              {activeData.tipe_penerima}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="custom-scrollbar max-h-[65vh] overflow-y-auto space-y-5 pr-1">

          {/* ── Mode CREATE: pilih tipe & penerima ── */}
          {mode === "create" && (
            <section>
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-100 dark:border-gray-800 pb-1.5">
                Penerima
              </h5>
              <div className="space-y-3">
                <div>
                  <Label>Tipe Penerima <span className="text-red-500">*</span></Label>
                  <select
                    value={tipe}
                    onChange={e => setTipe(e.target.value as TipePenerima)}
                    className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900"
                  >
                    <option value="ATLET">Atlet</option>
                    <option value="PELATIH">Pelatih</option>
                    <option value="OFFICIAL">Official</option>
                  </select>
                </div>
                <div>
                  <Label>
                    {tipe === "ATLET" ? "Atlet" : tipe === "PELATIH" ? "Pelatih" : "Official"}{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  {loadingPenerima ? (
                    <p className="text-xs text-gray-400 mt-1">Memuat daftar...</p>
                  ) : opsiPenerima.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Belum ada data {tipe.toLowerCase()}. Selesaikan Entry By Name terlebih dahulu.
                    </p>
                  ) : (
                    <select
                      value={penerimaId}
                      onChange={e => setPenerimaId(Number(e.target.value))}
                      className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900"
                    >
                      <option value="">-- Pilih penerima --</option>
                      {Object.entries(opsiGrouped).map(([kontingen, items]) => (
                        <optgroup key={kontingen} label={kontingen}>
                          {items.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nama_lengkap}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    nama_penerima otomatis diisi backend dari nama_lengkap
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ── Mode VIEW/EDIT: tampil penerima ── */}
          {mode !== "create" && activeData && (
            <section>
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-100 dark:border-gray-800 pb-1.5">
                Penerima
              </h5>
              <div className="rounded-lg border border-gray-100 dark:border-gray-800 px-4 py-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Nama Penerima</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{activeData.nama_penerima}</p>
                <p className="text-xs text-gray-400 mt-0.5">Tipe: {activeData.tipe_penerima}</p>
              </div>
            </section>
          )}

          {/* ── Data sertifikat ── */}
          <section>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-100 dark:border-gray-800 pb-1.5">
              Data Sertifikat
            </h5>
            <div className="space-y-4">
              <div>
                <Label>Judul Sertifikat <span className="text-red-500">*</span></Label>
                {isView
                  ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.judul}</p>
                  : <Input
                      type="text"
                      value={judul}
                      onChange={e => setJudul(e.target.value)}
                      placeholder="Sertifikat Peserta POPDA 2026"
                    />
                }
              </div>
              <div>
                <Label>Nomor Sertifikat</Label>
                {isView
                  ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.nomor_sertifikat || "—"}</p>
                  : <Input
                      type="text"
                      value={nomor}
                      onChange={e => setNomor(e.target.value)}
                      placeholder="POPDA/2026/ATL/001"
                    />
                }
              </div>
              <div>
                <Label>Tanggal Terbit <span className="text-red-500">*</span></Label>
                {isView
                  ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.tanggal_terbit}</p>
                  : <Input
                      type="date"
                      value={tanggal}
                      onChange={e => setTanggal(e.target.value)}
                    />
                }
              </div>
              <div>
                <Label>Catatan</Label>
                {isView
                  ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.catatan || "—"}</p>
                  : <textarea
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      rows={2}
                      placeholder="Opsional"
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900 resize-none"
                    />
                }
              </div>
            </div>
          </section>

          {/* ── Upload file PDF ── */}
          <section>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-100 dark:border-gray-800 pb-1.5">
              File PDF
            </h5>
            {mode === "create" && (
              <p className="text-xs text-gray-400">File PDF bisa diupload setelah sertifikat tersimpan melalui menu Edit.</p>
            )}
            {mode === "edit" && data?.id && (
              <FileRow
                currentPath={activeData?.file_sertifikat ?? null}
                onUpload={handleUpload}
                uploading={anyUploading}
              />
            )}
            {mode === "view" && (
              <div>
                {activeData?.file_sertifikat ? (
                  <a
                    href={activeData.file_sertifikat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-200 dark:border-brand-800/40 text-brand-600 dark:text-brand-400 text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Unduh / Lihat PDF
                  </a>
                ) : (
                  <p className="text-xs text-gray-400">Belum ada file PDF</p>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button size="sm" variant="outline" onClick={onClose} disabled={loading || anyUploading}>
            {isView ? "Tutup" : "Batal"}
          </Button>
          {!isView && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading || anyUploading}
              className="bg-brand-500 hover:bg-brand-600 text-white"
            >
              {loading ? "Menyimpan..." : mode === "create" ? "Simpan" : "Perbarui"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
