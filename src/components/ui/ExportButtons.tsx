/**
 * ExportButtons.tsx
 * Tombol PDF & Excel yang reusable untuk semua halaman tahap.
 */
import { useState } from "react";

interface ExportButtonsProps {
  onExportPDF: () => Promise<void>;
  onExportExcel: () => Promise<void>;
  /** Disable tombol saat tidak ada data */
  disabled?: boolean;
}

export default function ExportButtons({
  onExportPDF,
  onExportExcel,
  disabled = false,
}: ExportButtonsProps) {
  const [loadingPDF, setLoadingPDF]     = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  const handlePDF = async () => {
    if (loadingPDF || disabled) return;
    setLoadingPDF(true);
    try {
      await onExportPDF();
    } catch (err: any) {
      alert("Export PDF gagal: " + (err.message || "Coba lagi"));
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleExcel = async () => {
    if (loadingExcel || disabled) return;
    setLoadingExcel(true);
    try {
      await onExportExcel();
    } catch (err: any) {
      alert("Export Excel gagal: " + (err.message || "Coba lagi"));
    } finally {
      setLoadingExcel(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Tombol PDF */}
      <button
        type="button"
        onClick={handlePDF}
        disabled={disabled || loadingPDF}
        title="Download PDF"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800/40 dark:text-red-400 dark:hover:bg-red-900/20 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loadingPDF ? (
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
        ) : (
          /* File/PDF icon */
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
        PDF
      </button>

      {/* Tombol Excel */}
      <button
        type="button"
        onClick={handleExcel}
        disabled={disabled || loadingExcel}
        title="Download Excel"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800/40 dark:text-green-400 dark:hover:bg-green-900/20 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loadingExcel ? (
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-green-400 border-t-transparent" />
        ) : (
          /* Table/Excel icon */
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M3 14h18M10 3v18M14 3v18M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
          </svg>
        )}
        Excel
      </button>
    </div>
  );
}
