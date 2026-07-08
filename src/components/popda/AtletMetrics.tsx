// src/components/popda/AtletMetrics.tsx
import { useState, useEffect } from "react";
import { GroupIcon } from "../../icons";
import Badge from "../ui/badge/Badge";
import api from "../../lib/api";

/**
 * GET /admin/tahap3/statistik/atlet
 * Tidak butuh territory_id — backend aggregate semua kontingen.
 */
const getStatistikAtlet = (): Promise<{ total_atlet: number }> =>
  api.get("/admin/tahap3/statistik/atlet").then(r => {
    // Support berbagai struktur response dari backend
    const d = r.data;
    if (d?.data?.total_atlet !== undefined) return d.data;
    if (d?.total_atlet !== undefined) return d;
    return { total_atlet: 0 };
  });

export default function AtletMetrics() {
  const [totalAtlet, setTotalAtlet] = useState<number | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    getStatistikAtlet()
      .then(d => setTotalAtlet(d.total_atlet ?? 0))
      .catch(e => {
        console.error("[AtletMetrics] gagal fetch statistik atlet:", e?.response?.status, e?.message);
        setTotalAtlet(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatAngka = (n: number) =>
    n.toLocaleString("id-ID");

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
              {loading
                ? <span className="animate-pulse text-gray-300 dark:text-gray-600">—</span>
                : totalAtlet !== null
                  ? formatAngka(totalAtlet)
                  : "—"
              }
            </h4>
          </div>
        </div>
      </div>

      {/* Metric 2: Kab/Kota Aktif — tetap hardcode sampai endpoint tersedia */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
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
