/**
 * BiodataModal — Modal lihat biodata (view only) di Rekap Pendaftaran.
 */
import { Modal } from "../../../components/ui/modal";
import type { RekapAtlet, RekapPelatih, RekapOfficial } from "../service";

type Person =
  | { tipe: "atlet";    data: RekapAtlet }
  | { tipe: "pelatih";  data: RekapPelatih }
  | { tipe: "official"; data: RekapOfficial };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function resolveUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch { return d; }
}

// ─── Sub-komponen ─────────────────────────────────────────

function JKBadge({ jk }: { jk: "L" | "P" }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
      jk === "L"
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        : "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
    }`}>
      {jk === "L" ? "Laki-laki" : "Perempuan"}
    </span>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-2 border-b border-gray-50 dark:border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-400 dark:text-gray-500 pt-0.5 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 dark:text-white break-words">{value || "—"}</span>
    </div>
  );
}

function FotoAvatar({ src, name }: { src: string | null | undefined; name: string }) {
  const url = resolveUrl(src);
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="flex justify-center mb-5">
      {url ? (
        <img src={url} alt={name}
          className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 shadow"
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-2xl font-bold border-2 border-brand-200 dark:border-brand-800/40">
          {initials || "?"}
        </div>
      )}
    </div>
  );
}

function DocItem({ label, path }: { label: string; path: string | null | undefined }) {
  const url = resolveUrl(path);
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 font-medium">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Buka
        </a>
      ) : (
        <span className="text-xs text-gray-400 italic">Belum diupload</span>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-5 mb-2 pb-1.5 border-b border-gray-100 dark:border-gray-800">
      {children}
    </h5>
  );
}

// ─── Content per tipe ─────────────────────────────────────

function AtletContent({ data }: { data: RekapAtlet }) {
  return (
    <>
      <FotoAvatar src={data.foto} name={data.nama_lengkap} />

      <SectionTitle>Biodata</SectionTitle>
      <Row label="Nama Lengkap"       value={<span className="font-semibold">{data.nama_lengkap}</span>} />
      <Row label="Jenis Kelamin"      value={<JKBadge jk={data.jenis_kelamin} />} />
      <Row label="Tanggal Lahir"      value={fmtDate(data.tanggal_lahir)} />
      <Row label="Tempat Lahir"       value={data.tempat_lahir} />
      <Row label="NISN"               value={data.nisn} />
      <Row label="NIS"                value={data.nis} />
      <Row label="Sekolah"            value={data.sekolah} />
      <Row label="Kelas / Jurusan"    value={data.kelas_jurusan} />
      <Row label="Kabupaten / Kota"   value={data.kabupaten_kota} />
      <Row label="No. HP"             value={data.no_hp} />
      <Row label="Nama Ortu / Wali"   value={data.nama_ortu_wali} />
      <Row label="Alamat"             value={data.alamat} />
      <Row label="Status"             value={
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${
          data.status === "terverifikasi" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
          data.status === "terdaftar"     ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                           "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        }`}>{data.status}</span>
      } />

      {data.trx.length > 0 && (
        <>
          <SectionTitle>Nomor Pertandingan</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {data.trx.map((t, i) => (
              <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 border border-brand-100 dark:border-brand-800/30">
                {t.nama_cabor} / {t.nama_nomor}
                <span className="ml-1.5 text-brand-400">({t.jenis_kelamin} · {t.tipe})</span>
              </span>
            ))}
          </div>
        </>
      )}

      <SectionTitle>Dokumen</SectionTitle>
      <DocItem label="Kartu Pelajar"          path={data.file_kartu_pelajar} />
      <DocItem label="Akta Kelahiran"          path={data.file_akte_kelahiran} />
      <DocItem label="Kartu Keluarga"          path={data.file_kk} />
      <DocItem label="Surat Ket. Sekolah"      path={data.file_surat_keterangan_sekolah} />
      <DocItem label="Surat Izin Orang Tua"    path={data.file_surat_izin_ortu} />
    </>
  );
}

function PelatihContent({ data }: { data: RekapPelatih }) {
  return (
    <>
      <FotoAvatar src={data.foto} name={data.nama_lengkap} />

      <SectionTitle>Biodata</SectionTitle>
      <Row label="Nama Lengkap"     value={<span className="font-semibold">{data.nama_lengkap}</span>} />
      <Row label="Jenis Kelamin"    value={<JKBadge jk={data.jenis_kelamin} />} />
      <Row label="Tanggal Lahir"    value={fmtDate(data.tanggal_lahir)} />
      <Row label="Tempat Lahir"     value={data.tempat_lahir} />
      <Row label="NIK"              value={data.nik} />
      <Row label="Jabatan"          value={data.jabatan} />
      <Row label="Profesi"          value={data.profesi} />
      <Row label="Sekolah Asal"     value={data.sekolah_asal} />
      <Row label="Kabupaten / Kota" value={data.kabupaten_kota} />
      <Row label="No. HP"           value={data.no_hp} />
      <Row label="Email"            value={data.email} />
      <Row label="Alamat"           value={data.alamat} />
      <Row label="Status"           value={data.status} />

      {data.trx.length > 0 && (
        <>
          <SectionTitle>Cabor Ditangani</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {data.trx.map((t, i) => (
              <span key={i} className="inline-flex px-2.5 py-1 rounded-lg text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-100 dark:border-purple-800/30">
                {t.nama_cabor}
              </span>
            ))}
          </div>
        </>
      )}

      <SectionTitle>Dokumen</SectionTitle>
      <DocItem label="KTP"                path={data.file_ktp} />
      <DocItem label="Surat Tugas"        path={data.file_surat_tugas} />
      <DocItem label="Sertifikat Pelatih" path={data.file_sertifikat_pelatih} />
    </>
  );
}

function OfficialContent({ data }: { data: RekapOfficial }) {
  return (
    <>
      <FotoAvatar src={data.foto} name={data.nama_lengkap} />

      <SectionTitle>Biodata</SectionTitle>
      <Row label="Nama Lengkap"     value={<span className="font-semibold">{data.nama_lengkap}</span>} />
      <Row label="Jenis Kelamin"    value={<JKBadge jk={data.jenis_kelamin} />} />
      <Row label="Tanggal Lahir"    value={fmtDate(data.tanggal_lahir)} />
      <Row label="Tempat Lahir"     value={data.tempat_lahir} />
      <Row label="NIK"              value={data.nik} />
      <Row label="Jabatan"          value={data.jabatan} />
      <Row label="Sekolah Asal"     value={data.sekolah_asal} />
      <Row label="Kabupaten / Kota" value={data.kabupaten_kota} />
      <Row label="No. HP"           value={data.no_hp} />
      <Row label="Email"            value={data.email} />
      <Row label="Alamat"           value={data.alamat} />
      <Row label="Status"           value={data.status} />
      <Row label="Pendaftaran"      value={
        data.trx.length > 0
          ? <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Terdaftar sebagai official</span>
          : <span className="text-xs text-gray-400 italic">Belum didaftarkan</span>
      } />

      <SectionTitle>Dokumen</SectionTitle>
      <DocItem label="KTP"          path={data.file_ktp} />
      <DocItem label="Surat Tugas"  path={data.file_surat_tugas} />
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────

export default function BiodataModal({ isOpen, onClose, person }: Props) {
  if (!person) return null;

  const badgeColor =
    person.tipe === "atlet"   ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
    person.tipe === "pelatih" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                                "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[520px] m-4">
      <div className="no-scrollbar relative w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 p-6 lg:p-8">

        <div className="mb-4 pr-8">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white truncate">
            {person.data.nama_lengkap}
          </h4>
          <span className={`mt-1 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${badgeColor}`}>
            {person.tipe}
          </span>
        </div>

        <div className="custom-scrollbar max-h-[68vh] overflow-y-auto pr-1">
          {person.tipe === "atlet"    && <AtletContent   data={person.data} />}
          {person.tipe === "pelatih"  && <PelatihContent data={person.data} />}
          {person.tipe === "official" && <OfficialContent data={person.data} />}
        </div>

      </div>
    </Modal>
  );
}
