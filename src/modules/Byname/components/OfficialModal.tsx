import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import {
  MasterOfficial, OfficialPayload, JenisKelamin,
  createOfficial, updateOfficial, uploadFotoOfficial, uploadFileOfficial,
} from "../service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  data: MasterOfficial | null;
  territoryId?: number;
  onSuccess: (o: MasterOfficial) => void;
}

const EMPTY: OfficialPayload = { nama_lengkap: "", jenis_kelamin: "L", jabatan: "", kabupaten_kota: "", no_hp: "" };

// Foto punya endpoint terpisah: PUT /admin/master/official/:id/foto
// Dokumen pakai: PUT /admin/master/official/:id/file/:kolom
type OfficialFileKolom = "file_ktp" | "file_surat_tugas";

const OFFICIAL_DOCS: { kolom: OfficialFileKolom; label: string; accept: string }[] = [
  { kolom: "file_ktp",         label: "KTP",         accept: ".jpg,.jpeg,.png,.pdf" },
  { kolom: "file_surat_tugas", label: "Surat Tugas", accept: ".jpg,.jpeg,.png,.pdf" },
];

export default function OfficialModal({ isOpen, onClose, mode, data, territoryId, onSuccess }: Props) {
  const [form, setForm]     = useState<OfficialPayload>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<Partial<Record<OfficialFileKolom, File>>>({});
  const [localData, setLocalData] = useState<MasterOfficial | null>(null);

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
    setError(""); setLocalData(null); setFotoFile(null); setDocFiles({});
    if (data && mode !== "create") {
      setForm({
        nama_lengkap: data.nama_lengkap, jenis_kelamin: data.jenis_kelamin,
        tanggal_lahir: toDate(data.tanggal_lahir), tempat_lahir: data.tempat_lahir ?? "",
        nik: data.nik ?? "", sekolah_asal: data.sekolah_asal ?? "",
        jabatan: data.jabatan, alamat: data.alamat ?? "",
        kabupaten_kota: data.kabupaten_kota, no_hp: data.no_hp,
        email: data.email ?? "", catatan: data.catatan ?? "",
      });
    } else { setForm(EMPTY); }
  }, [isOpen, data, mode]);

  const f = (key: keyof OfficialPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.nama_lengkap || !form.jabatan || !form.kabupaten_kota || !form.no_hp) {
      setError("Lengkapi field wajib: nama, jabatan, kabupaten/kota, no. HP"); return;
    }
    if (form.nik && !/^\d{16}$/.test(form.nik)) {
      setError("NIK harus tepat 16 digit angka"); return;
    }
    if (!/^\d{10,13}$/.test(form.no_hp)) {
      setError("No. HP harus 10–13 digit angka"); return;
    }
    setLoading(true); setError("");
    try {
      let result: MasterOfficial;
      if (mode === "create") {
        result = (await createOfficial(form, territoryId)).data;
        const uploads: Promise<void>[] = [];
        if (fotoFile) uploads.push(uploadFotoOfficial(result.id, fotoFile, territoryId).then(() => {}).catch(() => {}));
        for (const [kolom, file] of Object.entries(docFiles) as [OfficialFileKolom, File][]) {
          if (file) uploads.push(uploadFileOfficial(result.id, kolom, file, territoryId).then(() => {}).catch(() => {}));
        }
        if (uploads.length) await Promise.all(uploads);
      } else {
        result = (await updateOfficial(data!.id, form, territoryId)).data;
        const editUploads: Promise<void>[] = [];
        if (fotoFile) editUploads.push(uploadFotoOfficial(result.id, fotoFile, territoryId).then(() => {}).catch(() => {}));
        for (const [kolom, file] of Object.entries(docFiles) as [OfficialFileKolom, File][]) {
          if (file) editUploads.push(uploadFileOfficial(result.id, kolom, file, territoryId).then(() => {}).catch(() => {}));
        }
        if (editUploads.length) await Promise.all(editUploads);
      }
      onSuccess(result); onClose();
    } catch (e: any) { setError(e.message || "Gagal menyimpan official"); }
    finally { setLoading(false); }
  };

  /** Upload foto dan dokumen sekarang dilakukan di handleSave */

  const txtField = (label: string, key: keyof OfficialPayload, placeholder?: string) => (
    <div>
      <Label>{label}</Label>
      {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{(activeData as any)?.[key] || "—"}</p>
        : <Input type="text" value={(form[key] as string) || ""} onChange={f(key)} placeholder={placeholder} />}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={`${isView ? "max-w-[900px]" : "max-w-[600px]"} m-4`}>
      <div className="no-scrollbar relative w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 p-6 lg:p-8">
        <div className="mb-5 pr-8">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
            {mode === "create" ? "Tambah Official" : mode === "edit" ? "Edit Official" : "Detail Official"}
          </h4>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <div className="custom-scrollbar max-h-[65vh] overflow-y-auto space-y-6 pr-1">

          {/* Foto & Dokumen — PALING ATAS */}
          <section>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-100 dark:border-gray-800 pb-1.5">
              Foto &amp; Dokumen
            </h5>
            {mode === "create" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-1.5">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Foto</span>
                  <input type="file" accept="image/jpeg,image/jpg,image/png"
                    onChange={e => setFotoFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-xs text-gray-500 dark:text-gray-400
                      file:mr-2 file:py-1 file:px-2 file:rounded file:border-0
                      file:text-xs file:bg-gray-100 file:text-gray-700
                      dark:file:bg-gray-700 dark:file:text-gray-200" />
                  <p className="text-xs text-gray-400">JPG / PNG • Opsional</p>
                </div>
                {OFFICIAL_DOCS.map(({ kolom, label, accept }) => (
                  <div key={kolom} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-1.5">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
                    <input type="file" accept={accept}
                      onChange={e => {
                        const file = e.target.files?.[0] ?? undefined;
                        setDocFiles(prev => file ? { ...prev, [kolom]: file } : (() => { const n = { ...prev }; delete n[kolom]; return n; })());
                      }}
                      className="block w-full text-xs text-gray-500 dark:text-gray-400
                        file:mr-2 file:py-1 file:px-2 file:rounded file:border-0
                        file:text-xs file:bg-gray-100 file:text-gray-700
                        dark:file:bg-gray-700 dark:file:text-gray-200" />
                    <p className="text-xs text-gray-400">JPG / PNG / PDF • Opsional</p>
                  </div>
                ))}
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                  Semua file akan diupload otomatis saat klik Simpan.
                </p>
              </div>
            )}
            {mode === "edit" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-1.5">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Foto {activeData?.foto && <span className="text-green-600 dark:text-green-400 font-normal">✓ Ada</span>}
                  </span>
                  <input type="file" accept="image/jpeg,image/jpg,image/png"
                    onChange={e => setFotoFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-xs text-gray-500 dark:text-gray-400
                      file:mr-2 file:py-1 file:px-2 file:rounded file:border-0
                      file:text-xs file:bg-gray-100 file:text-gray-700
                      dark:file:bg-gray-700 dark:file:text-gray-200" />
                  <p className="text-xs text-gray-400">JPG / PNG • Kosongkan jika tidak ingin mengubah</p>
                </div>
                {OFFICIAL_DOCS.map(({ kolom, label, accept }) => {
                  const hasFile = !!(activeData as any)?.[kolom];
                  return (
                    <div key={kolom} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-1.5">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {label} {hasFile && <span className="text-green-600 dark:text-green-400 font-normal">✓ Ada</span>}
                      </span>
                      <input type="file" accept={accept}
                        onChange={e => {
                          const file = e.target.files?.[0] ?? undefined;
                          setDocFiles(prev => file ? { ...prev, [kolom]: file } : (() => { const n = { ...prev }; delete n[kolom]; return n; })());
                        }}
                        className="block w-full text-xs text-gray-500 dark:text-gray-400
                          file:mr-2 file:py-1 file:px-2 file:rounded file:border-0
                          file:text-xs file:bg-gray-100 file:text-gray-700
                          dark:file:bg-gray-700 dark:file:text-gray-200" />
                      <p className="text-xs text-gray-400">JPG / PNG / PDF • Kosongkan jika tidak ingin mengubah</p>
                    </div>
                  );
                })}
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                  File yang dipilih akan diupload otomatis saat klik Perbarui.
                </p>
              </div>
            )}
            {mode === "view" && (
              <div className="flex items-center gap-6">
                <div className="shrink-0 flex flex-col items-center w-32">
                  {activeData?.foto ? (
                    <img src={activeData.foto} alt="Foto"
                      className="w-28 h-28 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 shadow"
                      onError={e => { e.currentTarget.src = "/images/user/placeholder.jpg"; }} />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-3xl font-bold border-2 border-brand-200 dark:border-brand-800/40">
                      {activeData?.nama_lengkap?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Dokumen</p>
                  {OFFICIAL_DOCS.map(({ kolom, label }) => {
                    const path = (activeData as any)?.[kolom] as string | null;
                    return (
                      <div key={kolom} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800/60 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${path ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                        </div>
                        {path ? (
                          <a href={path} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Buka
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Belum diupload</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Data Diri */}
          <section>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3 border-b border-gray-100 dark:border-gray-800 pb-1.5">Data Diri</h5>
            {/* view: semua field konsisten 2 kolom tanpa col-span — simetris */}
            <div className={`grid gap-4 ${isView ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
              {/* Nama — col-span-2 hanya di edit/create, di view masuk kolom 1 */}
              <div className={isView ? "" : "sm:col-span-2"}>
                <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.nama_lengkap}</p>
                  : <Input type="text" value={form.nama_lengkap} onChange={f("nama_lengkap")} placeholder="Nama lengkap official" />}
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
                <Label>Jabatan <span className="text-red-500">*</span></Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.jabatan}</p>
                  : <Input type="text" value={form.jabatan} onChange={f("jabatan")} placeholder="Manajer Tim / Dokter" />}
              </div>
              <div>
                <Label>Tanggal Lahir</Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{toDate(activeData?.tanggal_lahir) || "—"}</p>
                  : <Input type="date" value={form.tanggal_lahir || ""} onChange={f("tanggal_lahir")} />}
              </div>
              {txtField("Tempat Lahir", "tempat_lahir", "Kota tempat lahir")}
              <div>
                <Label>NIK</Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.nik || "—"}</p>
                  : <Input type="text" value={form.nik || ""}
                      onChange={e => setForm(p => ({ ...p, nik: e.target.value.replace(/\D/g, "").slice(0, 16) }))}
                      placeholder="16 digit NIK" />}
              </div>
              {txtField("Sekolah Asal", "sekolah_asal", "Asal instansi")}
              <div>
                <Label>Kabupaten / Kota <span className="text-red-500">*</span></Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.kabupaten_kota}</p>
                  : <Input type="text" value={form.kabupaten_kota} onChange={f("kabupaten_kota")} placeholder="Kabupaten/Kota" />}
              </div>
              <div>
                <Label>No. HP <span className="text-red-500">*</span></Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.no_hp}</p>
                  : <Input type="text" value={form.no_hp}
                      onChange={e => setForm(p => ({ ...p, no_hp: e.target.value.replace(/\D/g, "").slice(0, 13) }))}
                      placeholder="08xxxxxxxxxx" />}
              </div>
              {txtField("Email", "email", "email@contoh.id")}
              <div className={isView ? "" : "sm:col-span-2"}>
                <Label>Alamat</Label>
                {isView ? <p className="text-sm text-gray-800 dark:text-white mt-1">{activeData?.alamat || "—"}</p>
                  : <Input type="text" value={form.alamat || ""} onChange={f("alamat")} placeholder="Alamat lengkap" />}
              </div>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          {!isView && (
            <Button size="sm" onClick={handleSave} disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 text-white">
              {loading ? "Menyimpan..." : mode === "create" ? "Simpan" : "Perbarui"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
