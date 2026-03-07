// src/components/popda/RecentPendaftaran.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface TahapJadwal {
  id: number;
  tahap: string;
  periode: string;
  dibuka: string;
  ditutup: string;
  status: "Dibuka" | "Ditutup" | "Belum Dibuka";
}

const jadwalData: TahapJadwal[] = [
  {
    id: 1,
    tahap: "Tahap I: Entry By Sport",
    periode: "Tahap Kualifikasi Cabang Olahraga",
    dibuka: "01 Jan 2026",
    ditutup: "15 Jan 2026",
    status: "Ditutup",
  },
  {
    id: 2,
    tahap: "Tahap II: Entry By Number",
    periode: "Pendaftaran Nomor Pertandingan",
    dibuka: "16 Jan 2026",
    ditutup: "31 Jan 2026",
    status: "Dibuka",
  },
  {
    id: 3,
    tahap: "Tahap III: Entry By Names",
    periode: "Pendaftaran Nama Atlet, Pelatih & Official",
    dibuka: "01 Feb 2026",
    ditutup: "28 Feb 2026",
    status: "Belum Dibuka",
  },
];

export default function RecentPendaftaran() {
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
            {jadwalData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="py-3 text-gray-800 dark:text-white/90 font-medium">
                  {item.tahap}
                </TableCell>
                <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                  {item.periode}
                </TableCell>
                <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                  {item.dibuka}
                </TableCell>
                <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                  {item.ditutup}
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    size="sm"
                    color={
                      item.status === "Dibuka"
                        ? "success"
                        : item.status === "Belum Dibuka"
                        ? "warning"
                        : "error"
                    }
                  >
                    {item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}