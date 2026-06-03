import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import FileInput from "../../../components/form/input/FileInput";
import PhoneInput from "../../../components/form/group-input/PhoneInput";
import {
  identitasService,
  kontingenIdentitasService,
  fotoUrl,
  Identitas,
} from "../service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: Identitas | null;
  /** kontingen_id dari territory aktif — dipakai saat create baru (superadmin) */
  kontingenId: number | null;
  /** Apakah user adalah superadmin */
  isSuperAdmin: boolean;
  onSuccess: (updated: Identitas) => void;
}

const EMPTY_FORM = {
  kepala_nama: "",
  kepala_jabatan: "",
  kepala_nip: "",
  kepala_telepon: "",
  pic_nama: "",
  pic_jabatan: "",
  pic_telepon: "",
  alamat: "",
  email_instansi: "",
  phone_instansi: "",
};

export default function IdentitasEditModal({
  isOpen,
  onClose,
  data,
  kontingenId,
  isSuperAdmin,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // File baru yang dipilih user (null = tidak ganti foto)
  const [kepalaFotoFile, setKepalaFotoFile] = useState<File | null>(null);
  const [picFotoFile, setPicFotoFile] = useState<File | null>(null);

  // Preview URL — dari data lama atau object URL file baru
  const [kepalaPreview, setKepalaPreview] = useState<string>(fotoUrl(null));
  const [picPreview, setPicPreview] = useState<string>(fotoUrl(null));

  /* ── Populate form + preview saat modal dibuka ─────── */
  useEffect(() => {
    if (!isOpen) return;

    // Pre-populate semua field dari data yang sudah ada
    setForm({
      kepala_nama:    data?.kepala_nama    || "",
      kepala_jabatan: data?.kepala_jabatan || "",
      kepala_nip:     data?.kepala_nip     || "",
      kepala_telepon: data?.kepala_telepon || "",
      pic_nama:       data?.pic_nama       || "",
      pic_jabatan:    data?.pic_jabatan    || "",
      pic_telepon:    data?.pic_telepon    || "",
      alamat:         data?.alamat         || "",
      email_instansi: data?.email_instansi || "",
      phone_instansi: data?.phone_instansi || "",
    });

    // Preview foto dari data lama — tidak hilang saat modal dibuka
    setKepalaPreview(fotoUrl(data?.kepala_foto));
    setPicPreview(fotoUrl(data?.pic_foto));

    // Reset file input — foto lama tetap tersimpan di backend
    setKepalaFotoFile(null);
    setPicFotoFile(null);
  }, [isOpen, data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleKepalaFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setKepalaFotoFile(file);
      setKepalaPreview(URL.createObjectURL(file)); // preview lokal
    }
  };

  const handlePicFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPicFotoFile(file);
      setPicPreview(URL.createObjectURL(file));
    }
  };

  /* ── Upload foto superadmin ────────────────────────────
     Backend sekarang dual-mode: terima multipart/form-data
     (file upload) atau JSON fallback.
     Response: { success, message, foto: "/uploads/kepala/..." }
  ─────────────────────────────────────────────────────── */
  const uploadFotoSuperAdmin = async (
    identitasId: number,
    kepalaFile: File | null,
    picFile: File | null
  ): Promise<{ kepalaPath?: string; picPath?: string }> => {
    const result: { kepalaPath?: string; picPath?: string } = {};

    if (kepalaFile) {
      const fd = new FormData();
      fd.append("foto", kepalaFile);
      try {
        const res = await kontingenIdentitasService.updateKepalaFoto(identitasId, fd);
        if (res.foto) result.kepalaPath = res.foto;
      } catch (err: any) {
        console.warn("Upload kepala foto gagal:", err.message);
      }
    }

    if (picFile) {
      const fd = new FormData();
      fd.append("foto", picFile);
      try {
        const res = await kontingenIdentitasService.updatePicFoto(identitasId, fd);
        if (res.foto) result.picPath = res.foto;
      } catch (err: any) {
        console.warn("Upload PIC foto gagal:", err.message);
      }
    }

    return result;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      let result: Identitas;

      if (isSuperAdmin) {
        /* ── SUPERADMIN ──────────────────────────────────
           1. Simpan data teks via JSON
           2. Upload foto terpisah jika ada file baru
        ─────────────────────────────────────────────── */
        const payload = {
          kepala_nama:    form.kepala_nama,
          kepala_jabatan: form.kepala_jabatan,
          kepala_nip:     form.kepala_nip,
          kepala_telepon: form.kepala_telepon,
          pic_nama:       form.pic_nama,
          pic_jabatan:    form.pic_jabatan,
          pic_telepon:    form.pic_telepon,
          alamat:         form.alamat,
          email_instansi: form.email_instansi,
          phone_instansi: form.phone_instansi,
        };

        if (data?.id) {
          // Update existing
          const res = await kontingenIdentitasService.update(data.id, payload);
          result = res.data;

          // Pertahankan foto lama jika backend tidak mengembalikannya
          // dan tidak ada file baru yang diupload
          result = {
            ...result,
            kepala_foto: result.kepala_foto ?? data.kepala_foto ?? null,
            pic_foto:    result.pic_foto    ?? data.pic_foto    ?? null,
          };

          // Upload foto jika ada file baru — pakai path dari response
          if (kepalaFotoFile || picFotoFile) {
            const fotoPaths = await uploadFotoSuperAdmin(data.id, kepalaFotoFile, picFotoFile);
            // Merge path foto baru ke result (override foto lama)
            result = {
              ...result,
              ...(fotoPaths.kepalaPath ? { kepala_foto: fotoPaths.kepalaPath } : {}),
              ...(fotoPaths.picPath    ? { pic_foto:    fotoPaths.picPath    } : {}),
            };
          }
        } else {
          // Create baru
          if (!kontingenId) {
            alert("Tidak dapat menyimpan: kontingen belum terdaftar.");
            return;
          }
          const res = await kontingenIdentitasService.create({
            kontingen_id: kontingenId,
            ...payload,
          });
          result = res.data;

          // Upload foto setelah create
          if (kepalaFotoFile || picFotoFile) {
            const fotoPaths = await uploadFotoSuperAdmin(result.id, kepalaFotoFile, picFotoFile);
            result = {
              ...result,
              ...(fotoPaths.kepalaPath ? { kepala_foto: fotoPaths.kepalaPath } : {}),
              ...(fotoPaths.picPath    ? { pic_foto:    fotoPaths.picPath    } : {}),
            };
          }
        }
      } else {
        /* ── ADMIN BIASA ─────────────────────────────────
           PUT /admin/identitas — multipart/form-data
           Upsert otomatis dari JWT. Support upload foto.
           Foto lama tidak berubah jika tidak ada file baru.
        ─────────────────────────────────────────────── */
        const fd = new FormData();
        fd.append("kepala_nama",    form.kepala_nama);
        fd.append("kepala_jabatan", form.kepala_jabatan);
        fd.append("kepala_nip",     form.kepala_nip);
        fd.append("kepala_telepon", form.kepala_telepon);
        fd.append("pic_nama",       form.pic_nama);
        fd.append("pic_jabatan",    form.pic_jabatan);
        fd.append("pic_telepon",    form.pic_telepon);
        fd.append("alamat",         form.alamat);
        fd.append("email_instansi", form.email_instansi);
        fd.append("phone_instansi", form.phone_instansi);

        // Hanya append foto jika ada file baru — foto lama tidak terganggu
        if (kepalaFotoFile) fd.append("kepala_foto", kepalaFotoFile);
        if (picFotoFile)    fd.append("pic_foto",    picFotoFile);

        const res = await identitasService.update(fd);
        result = res.data;

        // Pertahankan foto lama jika backend tidak mengembalikannya
        // dan tidak ada file baru yang diupload
        result = {
          ...result,
          kepala_foto: result.kepala_foto ?? data?.kepala_foto ?? null,
          pic_foto:    result.pic_foto    ?? data?.pic_foto    ?? null,
        };
      }

      onSuccess(result);
      onClose();
      alert("Data identitas berhasil disimpan ✅");
    } catch (err: any) {
      console.error("❌ IdentitasEditModal save error:", err.response?.data || err.message);
      alert(
        "Gagal menyimpan: " +
        (err.response?.data?.message || err.response?.data?.error || err.message || "Cek console")
      );
    } finally {
      setLoading(false);
    }
  };

  const isCreate = !data?.id;
  const title = isCreate ? "Isi Data Identitas" : "Edit Identitas Kontingen";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[640px] mx-auto m-4 sm:m-8">
      <div className="relative w-full rounded-3xl bg-white dark:bg-gray-900">

        {/* Header */}
        <div className="px-6 pt-6 sm:px-10 sm:pt-8 pb-4 border-b border-gray-100 dark:border-gray-800">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">{title}</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isCreate
              ? "Isi data identitas kontingen. Semua field opsional."
              : "Ubah hanya field yang ingin diperbarui. Data lain tetap tersimpan."}
          </p>
        </div>

        {/* Body */}
        <div className="custom-scrollbar max-h-[60vh] overflow-y-auto px-6 sm:px-10 py-6 space-y-8">

          {/* ── KETUA KONTINGEN ─────────────────────────── */}
          <section>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
              Ketua Kontingen
            </h5>

            {/* Foto — tampil untuk semua role, preview dari data lama */}
            <div className="flex flex-col items-center mb-5">
              <div className="w-20 h-20 overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-700 mb-3">
                <img
                  src={kepalaPreview}
                  alt="Foto Ketua"
                  className="object-cover w-full h-full"
                  onError={(e) => { e.currentTarget.src = "/images/user/placeholder.jpg"; }}
                />
              </div>
              <Label>
                Foto Ketua{" "}
                <span className="text-xs font-normal text-gray-400">
                  (kosongkan jika tidak ingin mengubah)
                </span>
              </Label>
              <FileInput onChange={handleKepalaFoto} className="max-w-xs mt-2" />
              <p className="mt-1 text-xs text-gray-400">JPG / PNG • Maks. 2MB</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nama Lengkap</Label>
                <Input type="text" name="kepala_nama" value={form.kepala_nama}
                  onChange={handleChange} placeholder="Nama ketua kontingen" />
              </div>
              <div>
                <Label>Jabatan</Label>
                <Input type="text" name="kepala_jabatan" value={form.kepala_jabatan}
                  onChange={handleChange} placeholder="Ketua Kontingen" />
              </div>
              <div>
                <Label>NIP</Label>
                <Input type="text" name="kepala_nip" value={form.kepala_nip}
                  onChange={handleChange} placeholder="NIP (opsional)" />
              </div>
              <div className="sm:col-span-2">
                <Label>Nomor Telepon</Label>
                <PhoneInput
                  selectPosition="start"
                  countries={[{ code: "ID", label: "+62" }]}
                  value={form.kepala_telepon}
                  onChange={(v) => setForm((p) => ({ ...p, kepala_telepon: v }))}
                  placeholder="8123456789"
                />
              </div>
            </div>
          </section>

          {/* ── PIC / OPERATOR ──────────────────────────── */}
          <section>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
              PIC / Operator
            </h5>

            <div className="flex flex-col items-center mb-5">
              <div className="w-20 h-20 overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-700 mb-3">
                <img
                  src={picPreview}
                  alt="Foto PIC"
                  className="object-cover w-full h-full"
                  onError={(e) => { e.currentTarget.src = "/images/user/placeholder.jpg"; }}
                />
              </div>
              <Label>
                Foto PIC{" "}
                <span className="text-xs font-normal text-gray-400">
                  (kosongkan jika tidak ingin mengubah)
                </span>
              </Label>
              <FileInput onChange={handlePicFoto} className="max-w-xs mt-2" />
              <p className="mt-1 text-xs text-gray-400">JPG / PNG • Maks. 2MB</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nama Lengkap</Label>
                <Input type="text" name="pic_nama" value={form.pic_nama}
                  onChange={handleChange} placeholder="Nama PIC / operator" />
              </div>
              <div>
                <Label>Jabatan</Label>
                <Input type="text" name="pic_jabatan" value={form.pic_jabatan}
                  onChange={handleChange} placeholder="Staff / Koordinator" />
              </div>
              <div>
                <Label>Nomor Telepon</Label>
                <PhoneInput
                  selectPosition="start"
                  countries={[{ code: "ID", label: "+62" }]}
                  value={form.pic_telepon}
                  onChange={(v) => setForm((p) => ({ ...p, pic_telepon: v }))}
                  placeholder="8123456789"
                />
              </div>
            </div>
          </section>

          {/* ── INFORMASI INSTANSI ──────────────────────── */}
          <section>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
              Informasi Instansi
            </h5>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Alamat Instansi</Label>
                <Input type="text" name="alamat" value={form.alamat}
                  onChange={handleChange} placeholder="Jl. Merdeka No. 1" />
              </div>
              <div>
                <Label>Email Instansi</Label>
                <Input type="email" name="email_instansi" value={form.email_instansi}
                  onChange={handleChange} placeholder="dinas@kab.go.id" />
              </div>
              <div>
                <Label>Telepon Instansi</Label>
                <PhoneInput
                  selectPosition="start"
                  countries={[{ code: "ID", label: "+62" }]}
                  value={form.phone_instansi}
                  onChange={(v) => setForm((p) => ({ ...p, phone_instansi: v }))}
                  placeholder="2112345678"
                />
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 sm:px-10 py-5 border-t border-gray-100 dark:border-gray-800">
          <Button size="sm" variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>

      </div>
    </Modal>
  );
}
