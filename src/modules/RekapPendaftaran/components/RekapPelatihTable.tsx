import { useState } from "react";
import type { RekapPelatih } from "../service";
import BiodataModal from "./BiodataModal";

interface Props { pelatihs: RekapPelatih[]; }

function JKBadge({ jk }: { jk: "L" | "P" }) {
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
      jk === "L"
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        : "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
    }`}>{jk}</span>
  );
}

export default function RekapPelatihTable({ pelatihs }: Props) {
  const [selected, setSelected] = useState<RekapPelatih | null>(null);

  return (
    <>
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Pelatih</h3>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
          {pelatihs.length}
        </span>
      </div>
      {pelatihs.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">Belum ada pelatih.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <colgroup>
              <col className="w-10" />
              <col className="w-48" />
              <col className="w-14" />
              <col className="w-32" />
              <col className="w-36" />
              <col />
              <col className="w-16" />
            </colgroup>
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">No</th>
                <th className="px-4 py-3 text-left">Nama Lengkap</th>
                <th className="px-4 py-3 text-center">JK</th>
                <th className="px-4 py-3 text-left">Jabatan</th>
                <th className="px-4 py-3 text-left">No. HP</th>
                <th className="px-4 py-3 text-left">Cabor</th>
                <th className="px-4 py-3 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {pelatihs.map((p, i) => (
                <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{p.nama_lengkap}</td>
                  <td className="px-4 py-3 text-center"><JKBadge jk={p.jenis_kelamin} /></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.jabatan || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.no_hp}</td>
                  <td className="px-4 py-3">
                    {p.trx.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">Belum didaftarkan</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {p.trx.map((t, ti) => (
                          <span key={ti} className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {t.nama_cabor}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button type="button" onClick={() => setSelected(p)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200/70 dark:border-blue-800/40 transition-colors"
                      title="Lihat biodata">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    <BiodataModal
      isOpen={!!selected}
      onClose={() => setSelected(null)}
      person={selected ? { tipe: "pelatih", data: selected } : null}
    />
    </>
  );
}
