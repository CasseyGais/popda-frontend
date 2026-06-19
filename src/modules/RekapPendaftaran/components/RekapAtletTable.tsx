import type { RekapAtlet } from "../service";

interface Props {
  atlets: RekapAtlet[];
}

function JKBadge({ jk }: { jk: "L" | "P" }) {
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
      jk === "L"
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        : "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
    }`}>
      {jk}
    </span>
  );
}

export default function RekapAtletTable({ atlets }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Atlet</h3>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
          {atlets.length}
        </span>
      </div>

      {atlets.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">Belum ada atlet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">No</th>
                <th className="px-4 py-3 text-left">Nama Lengkap</th>
                <th className="px-4 py-3 text-center">JK</th>
                <th className="px-4 py-3 text-left">NISN</th>
                <th className="px-4 py-3 text-left">Sekolah</th>
                <th className="px-4 py-3 text-left">Nomor Pertandingan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {atlets.map((a, i) => (
                <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{a.nama_lengkap}</td>
                  <td className="px-4 py-3 text-center"><JKBadge jk={a.jenis_kelamin} /></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.nisn}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[140px] truncate">{a.sekolah}</td>
                  <td className="px-4 py-3">
                    {a.trx.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">Belum didaftarkan</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {a.trx.map((t, ti) => (
                          <span key={ti} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {t.nama_cabor} / {t.nama_nomor}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
