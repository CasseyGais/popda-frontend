import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import {
  MasterPelatih, PelatihPayload, JenisKelamin,
  createPelatih, updatePelatih, uploadFotoPelatih, uploadFilePelatih,
} from "../service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  data: MasterPelatih | null;
  territoryId?: number;
  onSuccess: (p: MasterPelatih) => void;
}

const EMPTY: PelatihPayload = { nama_lengkap: "", jenis_kelamin: "L", kabupaten_kota: "", no_hp: "" };

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  terdaftar: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  terverifikasi: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ditolak: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// Foto punya endpoint terpisah: PUT /admin/master/pelatih/:id/foto
// Dokumen pakai: PUT /admin/master/pelatih/:id/file/:kolom
type PelatihFileKolom = "file_ktp" | "file_surat_tugas" | "file_sertifikat_pelatih";

const PELATIH_DOCS: { kolom: PelatihFileKolom; label: string; accept: string }[] = [
  { kolom: "file_ktp",                label: "KTP",                accept: ".jpg,.jpeg,.png,.pdf" },
  { kolom: "file_surat_tugas",        label: "Surat Tugas",        accept: ".jpg,.jpeg,.png,.pdf" },
  { kolom: "file_sertifikat_pelatih", label: "Sertifikat Pelatih", accept: ".jpg,.jpeg,.png,.pdf" },
];

function FileRow({ label, accept, currentPath, onUpload, uploading }: {
  label: string; accept: string;
  currentPath: string | null | undefined;
  onUpload: (f: File) => Promise<void>;
  uploading: boolean;
}) {
  const [file, setFile]   = useState<File | null>(null);
  const [busy, setBusy]   = useState(false);
  const [done, setDone]   = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setBusy(true);
    try { await onUpload(file); setDone(true); setFile(null); }
    finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {currentPath && !done && (
          <a href={currentPath} target="_blank" rel="noopener noreferrer"
            className="text-xs text-brand-500 hover:underline">Lihat</a>
        )}
        {done && <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Terupload</span>}
      </div>
      <div className="flex items-center gap-2">
        <input type="file" accept={accept} onChange={e => { setFile(e.target.files?.[0] ?? null); setDone(false); }}
          className="flex-1 text-xs text-gray-500 dark:text-gray-400
            file:mr-2 file:py-1 file:px-2 file:rounded file:border-0
            file:text-xs file:bg-gray-100 file:text-gray-700
            dark:file:bg-gray-700 dark:file:text-gray-200" />
        <button type="button" onClick={handleUpload}
          disabled={!file || busy || uploading}
          className="shrink-0 px-2.5 py-1 rounded bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed">
          {busy ? "..." : "Upload"}
        </button>
      </div>
      {!currentPath && !done && <p className="text-xs text-gray-400">Belum ada file</p>}
    </div>
  );
}

export default function PelatihModal({ isOpen, onClose, mode, data, territoryId, onSuccess }: Props) {
  const [form, setForm]     = useState<PelatihPayload>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [localData, setLocalData] = useState<MasterPelatih | null>(null);
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
    setError(""); setLocalData(null);
    if (data && mode !== "create") {
      setForm({
        nama_lengkap: data.nama_lengkap, jenis_kelamin: data.jenis_kelamin,
        tanggal_lahir: toDate(data.tanggal_lahir),
        tempat_lahir: data.tempat_lahir ?? "",
        nik: data.nik ?? "", sekolah_asal: data.sekolah_asal ?? "",
        profesi: data.profesi ?? "", jabatan: data.jabatan ?? "",
        alamat: data.alamat ?? "", kabupaten_kota: data.kabupaten_kota,
        no_hp: data.no_hp, email: data.email ?? "",
        nama_istri_suami: data.nama_istri_suami ?? "",
        prestasi_sebelumnya: data.prestasi_sebelumnya ?? "", catatan: data.catatan ?? "",
      });
    } else { setForm(EMPTY); }
  }, [isOpen, data, mode]);

  const f = (key: keyof PelatihPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.nama_lengkap || !form.kabupaten_kota || !form.no_hp) {
      setError("Lengkapi field wajib: nama, kabupaten/kota, no. HP"); return;
    }
    setLoading(true); setError("");
    try {
      const result = mode === "create"
        ? (await createPelatih(form, territoryId)).data
        : (await updatePelatih(data!.id, form, territoryId)).data;
      onSuccess(result); onClose();
    } catch (e: any) { setError(e.message || "Gagal menyimpan pelatih"); }
    finally { setLoading(false); }
  };

  /** Upload foto — endpoint terpisah: PUT /admin/master/pelatih/:id/foto */
  const makeFotoUploader = () => async (file: File) => {
    const id = (localData ?? data)!.id;
    setAnyUploading(true);
    try {
      await uploadFotoPelatih(id, file);
      setLocalData(prev => ({ ...(prev ?? data!), foto: URL.createObjectURL(file) }));
    } finally { setAnyUploading(false); }
  };

  /** Upload dokumen — PUT /admin/master/pelatih/:id/file/:kolom */
  const makeUploader = (kolom: PelatihFileKolom) => async (file: File) => {
    const id = (localData ?? data)!.id;
    setAnyUploading(true);
    try {
      await uploadFilePelatih(id, kolom, file);
      setLocalData(prev => ({ ...(prev ?? data!), [kolom]: URL.createObjectURL(file) }));
    } finally { setAnyUploading(false); }
  };

  const txtField = (label: string, key: keyof PelatihPayload, placeholder?: string, required = false) => (
    <div>
      <Label>{label}{required && <span className="text-red-500"> *</span>}</Label>
      {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{(activeData as any)?.[key] || "—"}</p>
        : <Input type="text" value={(form[key] as string) || ""} onChange={f(key)} placeholder={placeholder} />}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[640px] m-4">
      <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 p-6 lg:p-8">
        <div className="mb-5 pr-8">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
            {mode === "create" ? "Tambah Pelatih" : mode === "edit" ? "Edit Pelatih" : "Detail Pelatih"}
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
          {/* Data Diri */}
          <section>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-100 dark:border-gray-800 pb-1.5">Data Diri</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.nama_lengkap}</p>
                  : <Input type="text" value={form.nama_lengkap} onChange={f("nama_lengkap")} placeholder="Nama lengkap pelatih" />}
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
                <Label>Tanggal Lahir</Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{toDate(activeData?.tanggal_lahir) || "—"}</p>
                  : <Input type="date" value={form.tanggal_lahir || ""} onChange={f("tanggal_lahir")} />}
              </div>
              {txtField("Tempat Lahir", "tempat_lahir", "Kota tempat lahir")}
              {txtField("NIK", "nik", "16 digit NIK")}
              {txtField("Sekolah Asal", "sekolah_asal", "Nama sekolah/instansi")}
              {txtField("Profesi", "profesi", "Pelatih Profesional")}
              {txtField("Jabatan", "jabatan", "Pelatih Kepala")}
              <div>
                <Label>Kabupaten / Kota <span className="text-red-500">*</span></Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.kabupaten_kota}</p>
                  : <Input type="text" value={form.kabupaten_kota} onChange={f("kabupaten_kota")} placeholder="Kabupaten/Kota" />}
              </div>
              <div>
                <Label>No. HP <span className="text-red-500">*</span></Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.no_hp}</p>
                  : <Input type="text" value={form.no_hp} onChange={f("no_hp")} placeholder="08xxxxxxxxxx" />}
              </div>
              {txtField("Email", "email", "email@contoh.id")}
              {txtField("Nama Istri/Suami", "nama_istri_suami", "Opsional")}
              <div className="sm:col-span-2">
                <Label>Alamat</Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.alamat || "—"}</p>
                  : <Input type="text" value={form.alamat || ""} onChange={f("alamat")} placeholder="Alamat lengkap" />}
              </div>
            </div>
          </section>

          {/* Upload Dokumen */}
          <section>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-100 dark:border-gray-800 pb-1.5">
              Foto &amp; Dokumen
            </h5>
            {mode === "create" && (
              <p className="text-xs text-gray-400">Foto dan dokumen bisa diupload setelah data tersimpan melalui menu Edit.</p>
            )}
            {mode === "edit" && data?.id && (
              <div className="space-y-3">
                {/* Foto — endpoint terpisah PUT /foto */}
                <FileRow
                  label="Foto" accept="image/*"
                  currentPath={activeData?.foto}
                  onUpload={makeFotoUploader()} uploading={anyUploading}
                />
                {/* Dokumen — PUT /file/:kolom */}
                {PELATIH_DOCS.map(({ kolom, label, accept }) => (
                  <FileRow key={kolom} label={label} accept={accept}
                    currentPath={(activeData as any)?.[kolom]}
                    onUpload={makeUploader(kolom)} uploading={anyUploading} />
                ))}
              </div>
            )}
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
                  {PELATIH_DOCS.map(({ kolom, label }) => {
                    const path = (activeData as any)?.[kolom] as string | null;
                    return (
                      <div key={kolom} className="flex items-center gap-2 py-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${path ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">{label}</span>
                        {path && <a href={path} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-500 hover:underline shrink-0">Lihat</a>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button size="sm" variant="outline" onClick={onClose} disabled={loading || anyUploading}>
            {isView ? "Tutup" : "Batal"}
          </Button>
          {!isView && (
            <Button size="sm" onClick={handleSave} disabled={loading || anyUploading}
              className="bg-brand-500 hover:bg-brand-600 text-white">
              {loading ? "Menyimpan..." : mode === "create" ? "Simpan" : "Perbarui"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
