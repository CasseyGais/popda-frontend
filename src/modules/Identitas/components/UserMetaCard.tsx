import { useAuth } from "../../../context/AuthContext";
import { Identitas, fotoUrl } from "../service";

interface UserMetaCardProps {
  role: "ketua" | "operator";
  data?: Identitas | null;
}

export default function UserMetaCard({ role, data }: UserMetaCardProps) {
  const { user } = useAuth();
  const isKetua = role === "ketua";

  const nama     = isKetua ? data?.kepala_nama     : data?.pic_nama;
  const jabatan  = isKetua ? data?.kepala_jabatan  : data?.pic_jabatan;
  const nip      = isKetua ? data?.kepala_nip      : null;
  const telepon  = isKetua ? data?.kepala_telepon  : data?.pic_telepon;
  const foto     = isKetua ? data?.kepala_foto     : data?.pic_foto;

  const empty = "Data Belum Diisi";

  return (
    <div className="border border-gray-200 rounded-2xl dark:border-gray-800 overflow-hidden">
      {/* Section header — sama seperti cabor header di Bynumber */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
          {isKetua ? "Ketua Kontingen" : "PIC / Operator"}
        </h4>
      </div>

      <div className="p-5 lg:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Foto */}
          <div className="w-20 h-20 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
            <img
              src={fotoUrl(foto)}
              alt={isKetua ? "Foto Ketua" : "Foto PIC"}
              className="object-cover w-full h-full"
              crossOrigin="anonymous"
              onLoad={() => console.log("✅ Foto loaded:", fotoUrl(foto))}
              onError={(e) => {
                console.warn("❌ Foto gagal load:", fotoUrl(foto));
                (e.currentTarget as HTMLImageElement).src = "/images/user/placeholder.jpg";
              }}
            />
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 w-full">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Nama Lengkap</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {nama || empty}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Jabatan</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {jabatan || empty}
              </p>
            </div>

            {isKetua && (
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">NIP</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {nip || empty}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Nomor Telepon</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {telepon || empty}
              </p>
            </div>

            {!isKetua && user?.kab_kota && (
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Wilayah</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.kab_kota}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
