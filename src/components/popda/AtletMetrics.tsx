// src/components/popda/AtletMetrics.tsx
import { GroupIcon } from "../../icons"; // ← hanya pakai yang sudah ada
import Badge from "../ui/badge/Badge";

export default function AtletMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Metric 1: Total Atlet Terdaftar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Atlet Terdaftar
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              1,248
            </h4>
          </div>
          <Badge color="success">
            <span className="mr-1">↑</span> 18.2%
          </Badge>
        </div>
      </div>

      {/* Metric 2: Kab/Kota Aktif */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" /> {/* ← pakai GroupIcon lagi */}
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Kab/Kota Aktif
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              8 / 8
            </h4>
          </div>
          <Badge color="success">
            <span className="mr-1">✓</span> 100%
          </Badge>
        </div>
      </div>
    </div>
  );
}