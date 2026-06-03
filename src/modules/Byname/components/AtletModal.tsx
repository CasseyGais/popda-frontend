import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import {
  MasterAtlet, AtletPayload, JenisKelamin,
  createAtlet, updateAtlet, uploadFotoAtlet, uploadFileAtlet,
} from "../service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  data: MasterAtlet | null;
  territoryId?: number;
  onSuccess: (a: MasterAtlet) => void;
}

const EMPTY: AtletPayload = {
  nama_lengkap: "", jenis_kelamin: "L", tanggal_lahir: "",
  nisn: "", sekolah: "", kabupaten_kota: "",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  terdaftar: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  terverifikasi: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ditolak: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

type AtletFileKolom = "file_kartu_pelajar" | "file_akte_kelahiran" | "file_kk"
  | "file_surat_keterangan_sekolah" | "file_surat_izin_ortu";

const ATLET_DOCS: { kolom: AtletFileKolom; label: string }[] = [
  { kolom: "file_kartu_pelajar",          label: "Kartu Pelajar" },
  { kolom: "file_akte_kelahiran",          label: "Akta Kelahiran" },
  { kolom: "file_kk",                      label: "Kartu Keluarga" },
  { kolom: "file_surat_keterangan_sekolah",label: "Surat Ket. Sekolah" },
  { kolom: "file_surat_izin_ortu",         label: "Surat Izin Ortu" },
];

/** Komponen satu baris upload file */
function FileRow({
  label, currentPath, onUpload, uploading,
}: {
  label: string;
  currentPath: string | null | undefined;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
}) {
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localUploading, setLocalUploading] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFile(e.target.files?.[0] ?? null);
    setDone(false);
  };

  const handleUpload = async () => {
    if (!localFile) return;
    setLocalUploading(true);
    try {
      await onUpload(localFile);
      setDone(true);
      setLocalFile(null);
    } finally {
      setLocalUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {currentPath && !done && (
          <a href={currentPath} target="_blank" rel="noopener noreferrer"
            className="text-xs text-brand-500 hover:underline flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Lihat
          </a>
        )}
        {done && <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Terupload</span>}
      </div>
      <div className="flex items-center gap-2">
        <input type="file" accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleChange}
          className="flex-1 text-xs text-gray-500 dark:text-gray-400
            file:mr-2 file:py-1 file:px-2 file:rounded file:border-0
            file:text-xs file:bg-gray-100 file:text-gray-700
            dark:file:bg-gray-700 dark:file:text-gray-200"
        />
        <button type="button" onClick={handleUpload}
          disabled={!localFile || localUploading || uploading}
          className="shrink-0 px-2.5 py-1 rounded bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed">
          {localUploading ? "..." : "Upload"}
        </button>
      </div>
      {!currentPath && !done && (
        <p className="text-xs text-gray-400">Belum ada file</p>
      )}
    </div>
  );
}

export default function AtletModal({ isOpen, onClose, mode, data, territoryId, onSuccess }: Props) {
  const [form, setForm]         = useState<AtletPayload>(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [localData, setLocalData] = useState<MasterAtlet | null>(null);
  const [anyUploading, setAnyUploading] = useState(false);

  const isView = mode === "view";
  const activeData = localData ?? data;

  /** Normalize tanggal ke YYYY-MM-DD — backend kadang kirim ISO timestamp */
  const toDate = (v: string | null | undefined): string => {
    if (!v) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    return v.slice(0, 10);
  };

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setFotoFile(null);
    setLocalData(null);
    if (data && mode !== "create") {
      setForm({
        nama_lengkap: data.nama_lengkap, jenis_kelamin: data.jenis_kelamin,
        tanggal_lahir: toDate(data.tanggal_lahir),
        tempat_lahir: data.tempat_lahir ?? "",
        nisn: data.nisn, nis: data.nis ?? "", sekolah: data.sekolah,
        kelas_jurusan: data.kelas_jurusan ?? "", alamat: data.alamat ?? "",
        kabupaten_kota: data.kabupaten_kota, no_hp: data.no_hp ?? "",
        nama_ortu_wali: data.nama_ortu_wali ?? "",
        prestasi_sebelumnya: data.prestasi_sebelumnya ?? "", catatan: data.catatan ?? "",
      });
    } else { setForm(EMPTY); }
  }, [isOpen, data, mode]);

  const f = (key: keyof AtletPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.nama_lengkap || !form.nisn || !form.tanggal_lahir || !form.sekolah || !form.kabupaten_kota) {
      setError("Lengkapi field wajib: nama, NISN, tgl lahir, sekolah, kabupaten/kota"); return;
    }
    setLoading(true); setError("");
    try {
      let result: MasterAtlet;
      if (mode === "create") {
        result = (await createAtlet(form, territoryId)).data;
      } else {
        result = (await updateAtlet(data!.id, form)).data;
      }
      if (fotoFile) {
        try { await uploadFotoAtlet(result.id, fotoFile); } catch { /* non-blocking */ }
      }
      onSuccess(result);
      onClose();
    } catch (e: any) { setError(e.message || "Gagal menyimpan atlet"); }
    finally { setLoading(false); }
  };

  /** Upload satu file dokumen — dipakai oleh FileRow */
  const makeDocUploader = (kolom: AtletFileKolom) => async (file: File) => {
    const id = (localData ?? data)!.id;
    setAnyUploading(true);
    try {
      await uploadFileAtlet(id, kolom, file);
      // refresh localData path
      setLocalData(prev => ({ ...(prev ?? data!), [kolom]: URL.createObjectURL(file) }));
    } finally { setAnyUploading(false); }
  };

  /** Upload foto — dipakai oleh FileRow di section edit */
  const makeFotoUploader = () => async (file: File) => {
    const id = (localData ?? data)!.id;
    setAnyUploading(true);
    try {
      await uploadFotoAtlet(id, file);
      setLocalData(prev => ({ ...(prev ?? data!), foto: URL.createObjectURL(file) }));
    } finally { setAnyUploading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[680px] m-4">
      <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-5 pr-8">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
            {mode === "create" ? "Tambah Atlet" : mode === "edit" ? "Edit Atlet" : "Detail Atlet"}
          </h4>
          {activeData && (
            <span className={`mt-1 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLOR[activeData.status]}`}>
              {activeData.status}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <div className="custom-scrollbar max-h-[65vh] overflow-y-auto space-y-6 pr-1">

          {/* ── Section: Data Diri ── */}
          <section>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-100 dark:border-gray-800 pb-1.5">Data Diri</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.nama_lengkap}</p>
                  : <Input type="text" value={form.nama_lengkap} onChange={f("nama_lengkap")} placeholder="Nama lengkap atlet" />}
              </div>
              <div>
                <Label>Jenis Kelamin <span className="text-red-500">*</span></Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</p>
                  : <select value={form.jenis_kelamin} onChange={e => setForm(p => ({ ...p, jenis_kelamin: e.target.value as JenisKelamin }))}
                      className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900">
                      <option value="L">Laki-laki (L)</option><option value="P">Perempuan (P)</option>
                    </select>}
              </div>
              <div>
                <Label>Tanggal Lahir <span className="text-red-500">*</span></Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{toDate(activeData?.tanggal_lahir)}</p>
                  : <Input type="date" value={form.tanggal_lahir} onChange={f("tanggal_lahir")} />}
              </div>
              <div>
                <Label>Tempat Lahir</Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.tempat_lahir || "—"}</p>
                  : <Input type="text" value={form.tempat_lahir || ""} onChange={f("tempat_lahir")} placeholder="Kota tempat lahir" />}
              </div>
              <div>
                <Label>NISN <span className="text-red-500">*</span></Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.nisn}</p>
                  : <Input type="text" value={form.nisn} onChange={f("nisn")} placeholder="10 digit NISN" />}
              </div>
              <div>
                <Label>NIS</Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.nis || "—"}</p>
                  : <Input type="text" value={form.nis || ""} onChange={f("nis")} placeholder="NIS sekolah" />}
              </div>
              <div className="sm:col-span-2">
                <Label>Sekolah <span className="text-red-500">*</span></Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.sekolah}</p>
                  : <Input type="text" value={form.sekolah} onChange={f("sekolah")} placeholder="Nama sekolah" />}
              </div>
              <div>
                <Label>Kelas / Jurusan</Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.kelas_jurusan || "—"}</p>
                  : <Input type="text" value={form.kelas_jurusan || ""} onChange={f("kelas_jurusan")} placeholder="VIII A" />}
              </div>
              <div>
                <Label>Kabupaten / Kota <span className="text-red-500">*</span></Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.kabupaten_kota}</p>
                  : <Input type="text" value={form.kabupaten_kota} onChange={f("kabupaten_kota")} placeholder="Kabupaten/Kota" />}
              </div>
              <div className="sm:col-span-2">
                <Label>Alamat</Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.alamat || "—"}</p>
                  : <Input type="text" value={form.alamat || ""} onChange={f("alamat")} placeholder="Alamat lengkap" />}
              </div>
              <div>
                <Label>No. HP</Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.no_hp || "—"}</p>
                  : <Input type="text" value={form.no_hp || ""} onChange={f("no_hp")} placeholder="08xxxxxxxxxx" />}
              </div>
              <div>
                <Label>Nama Orang Tua / Wali</Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.nama_ortu_wali || "—"}</p>
                  : <Input type="text" value={form.nama_ortu_wali || ""} onChange={f("nama_ortu_wali")} placeholder="Nama wali" />}
              </div>
              <div className="sm:col-span-2">
                <Label>Prestasi Sebelumnya</Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1 whitespace-pre-line">{activeData?.prestasi_sebelumnya || "—"}</p>
                  : <textarea value={form.prestasi_sebelumnya || ""} onChange={e => setForm(p => ({ ...p, prestasi_sebelumnya: e.target.value }))}
                      rows={2} placeholder="Opsional"
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900 resize-none" />}
              </div>
            </div>
          </section>

          {/* ── Section: Upload Foto & Dokumen ── */}
          {/* Tampil di create (foto saja), edit (foto + semua dokumen), view (tampil path) */}
          <section>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-100 dark:border-gray-800 pb-1.5">
              Foto &amp; Dokumen
            </h5>

            {/* Mode CREATE — hanya pilih foto, akan diupload setelah save */}
            {mode === "create" && (
              <div>
                <Label>Foto <span className="text-xs text-gray-400 font-normal">(opsional, bisa upload nanti lewat Edit)</span></Label>
                <input type="file" accept="image/*" onChange={e => setFotoFile(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0
                    file:text-xs file:font-medium file:bg-brand-50 file:text-brand-600
                    hover:file:bg-brand-100 dark:file:bg-brand-900/20 dark:file:text-brand-400" />
                <p className="mt-1 text-xs text-gray-400">Dokumen (kartu pelajar, akta, dll) bisa diupload setelah data tersimpan.</p>
              </div>
            )}

            {/* Mode EDIT — foto + semua dokumen dengan tombol upload langsung */}
            {mode === "edit" && data?.id && (
              <div className="space-y-3">
                <FileRow label="Foto" currentPath={activeData?.foto}
                  onUpload={makeFotoUploader()} uploading={anyUploading} />
                {ATLET_DOCS.map(({ kolom, label }) => (
                  <FileRow key={kolom} label={label}
                    currentPath={(activeData as any)?.[kolom]}
                    onUpload={makeDocUploader(kolom)} uploading={anyUploading} />
                ))}
              </div>
            )}

            {/* Mode VIEW — tampilkan daftar status dokumen */}
            {mode === "view" && (
              <div className="space-y-2">
                {/* Foto */}
                <div className="flex items-center gap-3">
                  {activeData?.foto
                    ? <img src={activeData.foto} alt="Foto" className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                        onError={e => { e.currentTarget.src = "/images/user/placeholder.jpg"; }} />
                    : <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                  }
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Foto</p>
                    <p className="text-xs text-gray-400">{activeData?.foto ? "Ada" : "Belum diupload"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {ATLET_DOCS.map(({ kolom, label }) => {
                    const path = (activeData as any)?.[kolom] as string | null;
                    return (
                      <div key={kolom} className="flex items-center gap-2 py-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${path ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">{label}</span>
                        {path && (
                          <a href={path} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-brand-500 hover:underline shrink-0">Lihat</a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button size="sm" variant="outline" type="button" onClick={onClose} disabled={loading || anyUploading}>
            {isView ? "Tutup" : "Batal"}
          </Button>
          {!isView && (
            <Button size="sm" type="button" onClick={handleSave} disabled={loading || anyUploading}
              className="bg-brand-500 hover:bg-brand-600 text-white">
              {loading ? "Menyimpan..." : mode === "create" ? "Simpan" : "Perbarui"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
