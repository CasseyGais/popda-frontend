import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import PhoneInput from "../../../components/form/group-input/PhoneInput";
import { kontingenService, kontingenIdentitasService, Identitas } from "../service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** territory_id dari selector yang aktif */
  territoryId: number;
  /** Nama territory untuk ditampilkan di form */
  territoryName: string;
  /** Dipanggil setelah kontingen + identitas berhasil dibuat */
  onSuccess: (identitas: Identitas) => void;
}

const EMPTY_FORM = {
  nama_kontingen: "",
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

export default function KontingenCreateModal({
  isOpen,
  onClose,
  territoryId,
  territoryName,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Reset form setiap kali modal dibuka
  useEffect(() => {
    if (isOpen) setForm(EMPTY_FORM);
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.nama_kontingen.trim()) {
      alert("Nama kontingen wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      // Step 1 — buat kontingen baru untuk territory ini
      const kontingenRes = await kontingenService.create({
        territory_id: territoryId,
        nama_kontingen: form.nama_kontingen,
      });

      const kontingenId = kontingenRes.data.id;

      // Step 2 — buat identitas untuk kontingen yang baru dibuat
      const identitasRes = await kontingenIdentitasService.create({
        kontingen_id: kontingenId,
        kepala_nama: form.kepala_nama,
        kepala_jabatan: form.kepala_jabatan,
        kepala_nip: form.kepala_nip,
        kepala_telepon: form.kepala_telepon,
        pic_nama: form.pic_nama,
        pic_jabatan: form.pic_jabatan,
        pic_telepon: form.pic_telepon,
        alamat: form.alamat,
        email_instansi: form.email_instansi,
        phone_instansi: form.phone_instansi,
      });

      onSuccess(identitasRes.data);
      onClose();
      alert(`Kontingen ${form.nama_kontingen} berhasil didaftarkan ✅`);
    } catch (err: any) {
      console.error("❌ KontingenCreateModal error:", err.response?.data || err.message);
      alert(
        "Gagal menyimpan: " +
        (err.response?.data?.message || err.response?.data?.error || err.message || "Cek console")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[640px] mx-auto m-4 sm:m-8">
      <div className="relative w-full rounded-3xl bg-white dark:bg-gray-900">

        {/* Header */}
        <div className="px-6 pt-6 sm:px-10 sm:pt-8 pb-4 border-b border-gray-100 dark:border-gray-800">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Daftarkan Kontingen
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Wilayah: <span className="font-medium text-gray-700 dark:text-gray-200">{territoryName}</span>
          </p>
        </div>

        {/* Body */}
        <div className="custom-scrollbar max-h-[60vh] overflow-y-auto px-6 sm:px-10 py-6 space-y-8">

          {/* DATA KONTINGEN */}
          <section>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
              Data Kontingen
            </h5>
            <div>
              <Label>
                Nama Kontingen <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                name="nama_kontingen"
                value={form.nama_kontingen}
                onChange={handleChange}
                placeholder={`Kontingen ${territoryName}`}
              />
            </div>
          </section>

          {/* KETUA KONTINGEN */}
          <section>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
              Ketua Kontingen
            </h5>
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

          {/* PIC / OPERATOR */}
          <section>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
              PIC / Operator
            </h5>
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

          {/* INFORMASI INSTANSI */}
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
          <Button size="sm" onClick={handleSave} disabled={loading}>
            {loading ? "Menyimpan..." : "Daftarkan Kontingen"}
          </Button>
        </div>

      </div>
    </Modal>
  );
}
