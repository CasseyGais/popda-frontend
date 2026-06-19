/**
 * ExportPDFModal
 * Modal untuk export PDF laporan pertandingan dengan tanda tangan digital.
 * Mendukung dua mode:
 * - Export satu laporan (target != null)
 * - Export batch / semua (target == null)
 *
 * Menggunakan library signature_pad untuk input tanda tangan via canvas.
 * Install: npm install signature_pad
 */

import { useState, useRef, useEffect } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import {
  laporanPertandinganService,
  BABAK_OPTIONS,
  type LaporanDetail,
  type TTDData,
  type ExportPDFPayload,
  type Babak,
  type CaborDropdownItem,
} from "../service";

// ─── Signature Pad Canvas ─────────────────────────────────

interface SignaturePadProps {
  label: string;
  onSave: (b64: string) => void;
  savedB64?: string;
}

function SignaturePadCanvas({ label, onSave, savedB64 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing  = useRef(false);
  const lastPos    = useRef<{ x: number; y: number } | null>(null);
  const hasStrokes = useRef(false);

  // ── Helpers posisi relatif canvas ──────────────────────
  const getPos = (e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (("clientX" in e ? e.clientX : e.clientX) - rect.left) * scaleX,
      y: (("clientY" in e ? e.clientY : e.clientY) - rect.top)  * scaleY,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth   = 1.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";

    // ── Mouse events ──────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      isDrawing.current = true;
      lastPos.current   = getPos(e, canvas);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDrawing.current || !lastPos.current) return;
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
      hasStrokes.current = true;
    };
    const onMouseUp = () => { isDrawing.current = false; lastPos.current = null; };

    // ── Touch events ──────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      lastPos.current   = getPos(e.touches[0], canvas);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current || !lastPos.current) return;
      const pos = getPos(e.touches[0], canvas);
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
      hasStrokes.current = true;
    };
    const onTouchEnd = () => { isDrawing.current = false; lastPos.current = null; };

    canvas.addEventListener("mousedown",  onMouseDown);
    canvas.addEventListener("mousemove",  onMouseMove);
    canvas.addEventListener("mouseup",    onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove",  onTouchMove,  { passive: false });
    canvas.addEventListener("touchend",   onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown",  onMouseDown);
      canvas.removeEventListener("mousemove",  onMouseMove);
      canvas.removeEventListener("mouseup",    onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove",  onTouchMove);
      canvas.removeEventListener("touchend",   onTouchEnd);
    };
  }, []);

  const handleSave = () => {
    if (!canvasRef.current || !hasStrokes.current) return;
    const b64 = canvasRef.current.toDataURL("image/png");
    onSave(b64);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokes.current = false;
    onSave("");
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</p>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={280}
          height={100}
          className="w-full rounded border border-dashed border-gray-300 dark:border-gray-600 bg-white cursor-crosshair"
          style={{ touchAction: "none" }}
        />
        {savedB64 && (
          <div className="absolute top-1 right-1">
            <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-white dark:bg-gray-900 px-1 rounded">
              ✓
            </span>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded text-xs font-medium transition-colors"
        >
          Gunakan
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs transition-colors"
        >
          Hapus
        </button>
      </div>
    </div>
  );
}

// ─── TTDForm — satu baris penandatangan ───────────────────

interface TTDFormProps {
  index: number;
  data: TTDData;
  onChange: (index: number, data: TTDData) => void;
  onRemove: (index: number) => void;
}

function TTDForm({ index, data, onChange, onRemove }: TTDFormProps) {
  const update = (partial: Partial<TTDData>) =>
    onChange(index, { ...data, ...partial });

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Penandatangan {index + 1}
        </span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
        >
          Hapus
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Jabatan</Label>
          <Input
            type="text"
            value={data.jabatan}
            onChange={e => update({ jabatan: e.target.value })}
            placeholder="Wasit / Ketua Panitia"
          />
        </div>
        <div>
          <Label>Nama Tercetak</Label>
          <Input
            type="text"
            value={data.nama_tercetak}
            onChange={e => update({ nama_tercetak: e.target.value })}
            placeholder="Nama lengkap"
          />
        </div>
        <div className="col-span-2">
          <Label>NIP (opsional)</Label>
          <Input
            type="text"
            value={data.nip ?? ""}
            onChange={e => update({ nip: e.target.value })}
            placeholder="198001012010011001"
          />
        </div>
      </div>
      <SignaturePadCanvas
        label="Tanda Tangan (gambar di area bawah)"
        savedB64={data.signature_b64}
        onSave={b64 => update({ signature_b64: b64 })}
      />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  target: LaporanDetail | null; // null = batch
}

const BABAK_LABEL: Record<Babak, string> = Object.fromEntries(
  BABAK_OPTIONS.map(o => [o.value, o.label])
) as Record<Babak, string>;

// ─── Component ───────────────────────────────────────────

export default function ExportPDFModal({ isOpen, onClose, target }: Props) {
  const isBatch = target === null;

  // Filter (batch only)
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterCaborId, setFilterCaborId] = useState<number | "">("");
  const [caborList, setCaborList]         = useState<CaborDropdownItem[]>([]);

  // Penandatangan
  const [ttdList, setTtdList] = useState<TTDData[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Reset saat modal dibuka + load dropdown cabor (batch)
  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setFilterTanggal("");
    setFilterCaborId("");
    setTtdList([]);
    if (target === null) {
      // batch mode — load dropdown cabor
      laporanPertandinganService.getCaborDropdown().then(setCaborList).catch(() => {});
    }
  }, [isOpen, target]);

  const addTTD = () =>
    setTtdList(prev => [...prev, { jabatan: "", nama_tercetak: "", nip: "", signature_b64: "" }]);

  const updateTTD = (idx: number, data: TTDData) =>
    setTtdList(prev => prev.map((t, i) => i === idx ? data : t));

  const removeTTD = (idx: number) =>
    setTtdList(prev => prev.filter((_, i) => i !== idx));

  const handleExport = async () => {
    setLoading(true);
    setError("");
    try {
      const payload: ExportPDFPayload = {
        ...(ttdList.length > 0 && { penandatangan: ttdList }),
      };

      if (isBatch) {
        if (filterTanggal) payload.tanggal = filterTanggal;
        if (filterCaborId !== "") payload.cabor_id = Number(filterCaborId);
        await laporanPertandinganService.exportBatch(payload);
      } else {
        await laporanPertandinganService.exportSatu(target!.id, payload);
      }
      onClose();
    } catch (e: any) {
      setError(e.message || "Gagal export PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] m-4">
      <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-5 pr-8">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
            {isBatch ? "Export PDF Batch" : "Export PDF Satu Laporan"}
          </h4>
          {!isBatch && target && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              #{target.id} · {target.nama_cabor} — {target.nama_nomor} ·{" "}
              {BABAK_LABEL[target.babak]}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="custom-scrollbar max-h-[70vh] overflow-y-auto space-y-6 pr-1">

          {/* ── Filter (batch only) ── */}
          {isBatch && (
            <section>
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-100 dark:border-gray-800 pb-1.5">
                Filter Laporan
              </h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tanggal (opsional)</Label>
                  <Input
                    type="date"
                    value={filterTanggal}
                    onChange={e => setFilterTanggal(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Kosong = export semua tanggal</p>
                </div>
                <div>
                  <Label>Cabor (opsional)</Label>
                  <select
                    value={filterCaborId}
                    onChange={e => setFilterCaborId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900"
                  >
                    <option value="">Semua Cabor</option>
                    {caborList.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Kosong = semua cabor</p>
                </div>
              </div>
            </section>
          )}

          {/* ── Tanda Tangan ── */}
          <section>
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-800 pb-1.5">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Tanda Tangan
              </h5>
              <button
                type="button"
                onClick={addTTD}
                className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Penandatangan
              </button>
            </div>

            {ttdList.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 py-6 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Belum ada penandatangan.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF akan di-generate tanpa tanda tangan.
                </p>
                <button
                  type="button"
                  onClick={addTTD}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                >
                  + Tambah Penandatangan
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {ttdList.map((ttd, idx) => (
                  <TTDForm
                    key={idx}
                    index={idx}
                    data={ttd}
                    onChange={updateTTD}
                    onRemove={removeTTD}
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Gambar tanda tangan di area canvas menggunakan mouse atau layar sentuh, lalu klik "Gunakan".
              Field signature_b64 kosong = area tanda tangan kosong di PDF.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button size="sm" variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading
              ? "Membuat PDF..."
              : isBatch
                ? "Export PDF Batch"
                : "Export PDF"
            }
          </Button>
        </div>
      </div>
    </Modal>
  );
}
