/**
 * MediaUploadRow
 * Baris upload foto atau video bukti pertandingan.
 * Dipakai di dalam LaporanModal (mode edit & view).
 */

import { useState } from "react";

interface Props {
  label: string;
  currentPath: string | null;
  accept: string;               // "image/*" | "video/*"
  readonly?: boolean;           // mode view — hanya tampilkan link
  onUpload?: (file: File) => Promise<void>;
  uploading?: boolean;          // ada upload lain yang sedang berjalan
}

export default function MediaUploadRow({
  label,
  currentPath,
  accept,
  readonly = false,
  onUpload,
  uploading = false,
}: Props) {
  const [file, setFile]   = useState<File | null>(null);
  const [busy, setBusy]   = useState(false);
  const [done, setDone]   = useState(false);

  const handleUpload = async () => {
    if (!file || !onUpload) return;
    setBusy(true);
    try {
      await onUpload(file);
      setDone(true);
      setFile(null);
    } finally {
      setBusy(false);
    }
  };

  const BASE_URL = "http://localhost:8000";
  const fullPath = currentPath
    ? currentPath.startsWith("http") ? currentPath : `${BASE_URL}${currentPath}`
    : null;

  // ── Mode read-only (view) ──────────────────────────────
  if (readonly) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 px-4 py-2.5">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
        {fullPath ? (
          <a
            href={fullPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Buka
          </a>
        ) : (
          <span className="text-xs text-gray-400">Belum ada file</span>
        )}
      </div>
    );
  }

  // ── Mode edit ─────────────────────────────────────────
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <div className="flex items-center gap-3">
          {fullPath && !done && (
            <a href={fullPath} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline">
              Lihat
            </a>
          )}
          {done && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Terupload</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept={accept}
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
      {!currentPath && !done && (
        <p className="text-xs text-gray-400">Belum ada {label.toLowerCase()}</p>
      )}
    </div>
  );
}
