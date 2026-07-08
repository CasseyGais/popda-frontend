/**
 * ExportTTDModal — Modal tanda tangan untuk export PDF sertifikat.
 *
 * Dua mode:
 * - Export satu sertifikat (target != null)
 * - Export batch (target == null)
 *
 * Tanda tangan dikumpulkan via HTML Canvas (mouse + touch, tanpa library eksternal).
 * Data dikirim sebagai base64 PNG ke POST /admin/sertifikat/:id/export/pdf
 * atau POST /admin/sertifikat/export/batch/pdf
 *
 * Format signature_b64 yang diterima backend:
 * - "data:image/png;base64,iVBOR..." ← dengan prefix (output toDataURL) ✅
 * - "iVBOR..."                        ← tanpa prefix ✅
 * - "" atau tidak ada                 ← garis kosong di PDF ✅
 */

import { useState, useRef, useEffect } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import type { Sertifikat, TTDSertifikat, TipePenerima } from "../service";

// ─── Canvas Signature Pad ─────────────────────────────────

interface SignaturePadProps {
  label: string;
  onSave: (b64: string) => void;
  savedB64?: string;
}

function SignaturePadCanvas({ label, onSave, savedB64 }: SignaturePadProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const isDrawing    = useRef(false);
  const lastPos      = useRef<{ x: number; y: number } | null>(null);
  const hasStrokes   = useRef(false);

  const getPos = (e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (("clientX" in e ? e.clientX : (e as Touch).clientX) - rect.left) * scaleX,
      y: (("clientY" in e ? e.clientY : (e as Touch).clientY) - rect.top)  * scaleY,
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

    const onMouseDown = (e: MouseEvent) => { isDrawing.current = true; lastPos.current = getPos(e, canvas); };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDrawing.current || !lastPos.current) return;
      const pos = getPos(e, canvas);
      ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y); ctx.stroke();
      lastPos.current = pos; hasStrokes.current = true;
    };
    const onMouseUp = () => { isDrawing.current = false; lastPos.current = null; };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault(); isDrawing.current = true; lastPos.current = getPos(e.touches[0], canvas);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current || !lastPos.current) return;
      const pos = getPos(e.touches[0], canvas);
      ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y); ctx.stroke();
      lastPos.current = pos; hasStrokes.current = true;
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
    onSave(canvasRef.current.toDataURL("image/png"));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
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
          <span className="absolute top-1 right-1 text-xs text-green-600 dark:text-green-400 font-medium bg-white dark:bg-gray-900 px-1 rounded">
            ✓
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handleSave}
          className="px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded text-xs font-medium transition-colors">
          Gunakan
        </button>
        <button type="button" onClick={handleClear}
          className="px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs transition-colors">
          Hapus
        </button>
      </div>
    </div>
  );
}

// ─── Form satu penandatangan ──────────────────────────────

interface TTDFormProps {
  index: number;
  data: TTDSertifikat;
  onChange: (i: number, d: TTDSertifikat) => void;
  onRemove: (i: number) => void;
}

function TTDForm({ index, data, onChange, onRemove }: TTDFormProps) {
  const upd = (partial: Partial<TTDSertifikat>) => onChange(index, { ...data, ...partial });
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Penandatangan {index + 1}
        </span>
        <button type="button" onClick={() => onRemove(index)}
          className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400">
          Hapus
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Jabatan</Label>
          <Input type="text" value={data.jabatan}
            onChange={e => upd({ jabatan: e.target.value })}
            placeholder="Ketua Pelaksana" />
        </div>
        <div>
          <Label>Nama Tercetak</Label>
          <Input type="text" value={data.nama_tercetak}
            onChange={e => upd({ nama_tercetak: e.target.value })}
            placeholder="Nama lengkap" />
        </div>
        <div className="col-span-2">
          <Label>NIP (opsional)</Label>
          <Input type="text" value={data.nip ?? ""}
            onChange={e => upd({ nip: e.target.value })}
            placeholder="198001012010011001" />
        </div>
      </div>
      <SignaturePadCanvas
        label="Tanda Tangan (gambar di area bawah)"
        savedB64={data.signature_b64}
        onSave={b64 => upd({ signature_b64: b64 })}
      />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  target: Sertifikat | null;         // null = batch
  filterTipe?: TipePenerima;         // untuk label batch
  onExport: (ttds: TTDSertifikat[]) => Promise<void>;
}

// ─── Component ───────────────────────────────────────────

export default function ExportTTDModal({ isOpen, onClose, target, filterTipe, onExport }: Props) {
  const isBatch = target === null;

  const [ttdList, setTtdList] = useState<TTDSertifikat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTtdList([]);
    setError("");
  }, [isOpen]);

  const addTTD    = () => setTtdList(prev => [...prev, { jabatan: "", nama_tercetak: "", nip: "", signature_b64: "" }]);
  const updateTTD = (i: number, d: TTDSertifikat) => setTtdList(prev => prev.map((t, idx) => idx === i ? d : t));
  const removeTTD = (i: number) => setTtdList(prev => prev.filter((_, idx) => idx !== i));

  const handleExport = async () => {
    setLoading(true);
    setError("");
    try {
      await onExport(ttdList);
      onClose();
    } catch (e: any) {
      setError(e.message || "Gagal export PDF");
    } finally {
      setLoading(false);
    }
  };

  const batchLabel = filterTipe ? `(${filterTipe})` : "(Semua)";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] m-4">
      <div className="no-scrollbar relative w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 p-6 lg:p-8">

        {/* Header */}
        <div className="mb-5 pr-8">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
            {isBatch ? `Export Batch PDF ${batchLabel}` : "Export PDF Sertifikat"}
          </h4>
          {!isBatch && target && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {target.nama_penerima} · {target.tipe_penerima}
            </p>
          )}
          {isBatch && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tanda tangan akan muncul <strong>sekali di halaman terakhir</strong> dokumen.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="custom-scrollbar max-h-[65vh] overflow-y-auto space-y-4 pr-1">

          {/* Tanda tangan */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-800 pb-1.5">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Tanda Tangan
              </h5>
              <button type="button" onClick={addTTD}
                className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Penandatangan
              </button>
            </div>

            {ttdList.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 py-6 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">Belum ada penandatangan.</p>
                <p className="text-xs text-gray-400 mt-1">PDF akan di-generate dengan garis tanda tangan kosong.</p>
                <button type="button" onClick={addTTD}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline">
                  + Tambah Penandatangan
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {ttdList.map((ttd, i) => (
                  <TTDForm key={i} index={i} data={ttd} onChange={updateTTD} onRemove={removeTTD} />
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Gambar tanda tangan di area canvas menggunakan mouse atau layar sentuh, lalu klik "Gunakan".
              Biarkan kosong untuk area garis tanda tangan manual di PDF.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button size="sm" onClick={handleExport} disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white">
            {loading ? "Membuat PDF..." : isBatch ? "Export Batch PDF" : "Export PDF"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
