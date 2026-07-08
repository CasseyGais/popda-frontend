import { useState } from "react";

interface Props {
  tahap: 1 | 2 | 3;
  onReset: () => Promise<void>;
}

/**
 * Tombol "Reset ke Draft" untuk superadmin.
 * Menampilkan modal konfirmasi sebelum eksekusi reset.
 * Hanya di-render dari halaman yang sudah memvalidasi isSuperAdmin && isSubmitted.
 */
export function ResetTahapButton({ tahap, onReset }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending]     = useState(false);
  const [errorMsg, setErrorMsg]       = useState("");

  const handleConfirm = async () => {
    setIsPending(true);
    setErrorMsg("");
    try {
      await onReset();
      setShowConfirm(false);
    } catch (e: any) {
      setErrorMsg(e.message || `Gagal mereset tahap ${tahap}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset ke Draft
      </button>

      {/* Modal konfirmasi */}
      {showConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
            {/* Icon + Judul */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Reset Tahap {tahap} ke Draft?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Status tahap akan kembali ke DRAFT. Data yang sudah diisi tidak akan
                  dihapus, tapi kontingen perlu submit ulang.
                </p>
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                {errorMsg}
              </p>
            )}

            {/* Tombol aksi */}
            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => { setShowConfirm(false); setErrorMsg(""); }}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="px-4 py-2 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {isPending ? "Mereset..." : "Ya, Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
