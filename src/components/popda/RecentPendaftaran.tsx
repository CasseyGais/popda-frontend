// src/components/popda/RecentPendaftaran.tsx
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { pengaturanTahapService, type PengaturanTahap } from "../../modules/PengaturanTahap/service";

const TAHAP_LABELS: Record<number, { nama: string; periode: string }> = {
  1: { nama: "Tahap I: Entry By Sport",   periode: "Tahap Kualifikasi Cabang Olahraga" },
  2: { nama: "Tahap II: Entry By Number", periode: "Pendaftaran Nomor Pertandingan" },
  3: { nama: "Tahap III: Entry By Name",  periode: "Pendaftaran Nama Atlet, Pelatih & Official" },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function getStatus(p: PengaturanTahap): { label: string; color: "success" | "warning" | "error" } {
  if (p.is_open)  return { label: "Dibuka",      color: "success" };
  // Sudah pernah buka (tanggal_buka ada) tapi sekarang tutup → Ditutup
  if (p.tanggal_buka) return { label: "Ditutup",  color: "error" };
  return { label: "Belum Dibuka", color: "warning" };
}

export default function RecentPendaftaran() {
  const [list, setList]       = useState<PengaturanTahap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pengaturanTahapService.getAll()
      .then(data => setList(data))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Jadwal Tahap Pendaftaran
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Periode pembukaan dan penutupan tiap tahap pendaftaran POPDA
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500" />
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Tahap
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Periode
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Dibuka
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Ditutup
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Status
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {list.map((item) => {
                const label   = TAHAP_LABELS[item.tahap];
                const status  = getStatus(item);
                return (
                  <TableRow key={item.tahap}>
                    <TableCell className="py-3 text-gray-800 dark:text-white/90 font-medium">
                      {label?.nama ?? `Tahap ${item.tahap}`}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                      {label?.periode ?? "—"}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(item.tanggal_buka)}
                    </TableCell>
                    <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(item.tanggal_tutup)}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge size="sm" color={status.color}>
                        {status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
