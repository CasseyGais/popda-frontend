import type { ValidasiStatus } from "../service";

interface Props {
  status: ValidasiStatus;
  catatan?: string | null;
  showCatatan?: boolean;
}

const CONFIG = {
  VALID: {
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800/40",
    text: "text-green-700 dark:text-green-400",
    label: "✅ Valid",
  },
  PENDING: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800/40",
    text: "text-blue-700 dark:text-blue-400",
    label: "⏳ Menunggu Validasi",
  },
  REVISI: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-800/40",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "⚠ Perlu Revisi",
  },
};

export default function StatusValidasiBadge({ status, catatan, showCatatan = false }: Props) {
  if (!status) {
    return (
      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        — Belum disubmit
      </span>
    );
  }

  const cfg = CONFIG[status];

  return (
    <div className={`inline-flex flex-col gap-0.5`}>
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </span>
      {showCatatan && status === "REVISI" && catatan && (
        <p className={`text-xs ${cfg.text} mt-0.5`}>
          <em>"{catatan}"</em>
        </p>
      )}
    </div>
  );
}
