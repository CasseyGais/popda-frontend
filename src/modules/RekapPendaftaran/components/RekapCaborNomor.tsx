import type { RekapPendaftaran } from "../service";

interface Props {
  cabor_terpilih: RekapPendaftaran["cabor_terpilih"];
  nomor_terdaftar: RekapPendaftaran["nomor_terdaftar"];
}

export default function RekapCaborNomor({ cabor_terpilih, nomor_terdaftar }: Props) {
  if (cabor_terpilih.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-8 text-center">
        <p className="text-sm text-gray-400">Belum ada cabor terpilih. Selesaikan Tahap 1 terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Cabor & Nomor Pertandingan</h3>
        <p className="text-xs text-gray-400 mt-0.5">Tahap 1 & Tahap 2</p>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
        {cabor_terpilih.map(cabor => {
          const nomors = nomor_terdaftar.filter(n => n.cabor_id === cabor.cabor_id);
          return (
            <div key={cabor.cabor_id} className="px-5 py-4">
              {/* Header cabor */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{cabor.nama_cabor}</p>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Putra: {cabor.putra}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
                    Putri: {cabor.putri}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    Pelatih: {cabor.pelatih}
                  </span>
                </div>
              </div>

              {/* Nomor terdaftar */}
              {nomors.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Belum ada nomor terdaftar untuk cabor ini.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {nomors.map(n => (
                    <span
                      key={n.nomor_id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                    >
                      ✓ {n.nama_nomor}
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        n.jenis_kelamin === "PUTRA"
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          : n.jenis_kelamin === "PUTRI"
                          ? "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
                          : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                      }`}>
                        {n.jenis_kelamin}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
