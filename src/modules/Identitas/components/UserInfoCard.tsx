import { useState, useEffect, useRef } from "react";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import { EnvelopeIcon } from "../../../icons";
import PhoneInput from "../../../components/form/group-input/PhoneInput";
import FileInput from "../../../components/form/input/FileInput";
import api from "../../../lib/api";
import { Identitas } from "../service";

interface UserInfoCardProps {
  role: "ketua" | "operator";
  data?: Identitas | null;
  onUpdate?: (data: Identitas) => void;
}

export default function UserInfoCard({ role, data, onUpdate }: UserInfoCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const isKetua = role === "ketua";

  // Form state — diisi dari props saat pertama kali atau saat data berubah
  const [formData, setFormData] = useState({
    namaLengkap: "",
    jabatan: "",
    nip: "",
    nomorTelepon: "",
  });

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("/images/user/placeholder.jpg");
  const [loading, setLoading] = useState(false);

  // Sinkronisasi form dengan data dari parent (hanya saat data berubah dari luar, bukan saat user mengetik)
  // Gunakan ref untuk track apakah modal sedang terbuka — jika terbuka, jangan reset form
  const isModalOpenRef = useRef(false);

  useEffect(() => {
    isModalOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    // Jangan reset form saat modal sedang terbuka (user sedang mengetik)
    if (isModalOpenRef.current) return;

    if (data) {
      const nama = isKetua ? data.kepala_nama : data.pic_nama;
      const jabatan = isKetua ? data.kepala_jabatan : data.pic_jabatan;
      const nip = isKetua ? data.kepala_nip : "";
      const telepon = isKetua ? data.kepala_telepon : data.pic_telepon;
      const foto = isKetua ? data.kepala_foto : data.pic_foto;

      setFormData({
        namaLengkap: nama || "",
        jabatan: jabatan || "",
        nip: nip || "",
        nomorTelepon: telepon || "",
      });

      if (foto) {
        setPreviewUrl(`http://localhost:8000${foto}`);
      } else {
        setPreviewUrl("/images/user/placeholder.jpg");
      }
    }
  }, [data, isKetua]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (phoneNumber: string) => {
    setFormData((prev) => ({ ...prev, nomorTelepon: phoneNumber }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const formDataToSend = new FormData();

      if (isKetua) {
        formDataToSend.append("kepala_nama", formData.namaLengkap);
        formDataToSend.append("kepala_jabatan", formData.jabatan);
        formDataToSend.append("kepala_nip", formData.nip);
        formDataToSend.append("kepala_telepon", formData.nomorTelepon);
        if (profilePhoto) {
          formDataToSend.append("kepala_foto", profilePhoto);
        }
      } else {
        formDataToSend.append("pic_nama", formData.namaLengkap);
        formDataToSend.append("pic_jabatan", formData.jabatan);
        formDataToSend.append("pic_telepon", formData.nomorTelepon);
        if (profilePhoto) {
          formDataToSend.append("pic_foto", profilePhoto);
        }
      }

      const response = await api.put("/admin/identitas", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedData: Identitas = response.data.data;

      // Update preview foto jika ada
      const newFoto = isKetua ? updatedData?.kepala_foto : updatedData?.pic_foto;
      if (newFoto) {
        setPreviewUrl(`http://localhost:8000${newFoto}`);
      }

      // Reset file input
      setProfilePhoto(null);

      // Beritahu parent agar semua card ikut update
      if (onUpdate && updatedData) {
        onUpdate(updatedData);
      }

      closeModal();
      alert("Data berhasil disimpan ✅");
    } catch (error: any) {
      console.error("Gagal simpan:", error.response?.data || error.message);
      alert(
        "Gagal menyimpan data: " +
          (error.response?.data?.message || error.response?.data?.error || error.message || "Cek console")
      );
    } finally {
      setLoading(false);
    }
  };

  // Data tampilan (dari props, bukan dari form state)
  const displayNama = (isKetua ? data?.kepala_nama : data?.pic_nama) || "Data Belum Diisi";
  const displayJabatan = (isKetua ? data?.kepala_jabatan : data?.pic_jabatan) || "Data Belum Diisi";
  const displayNip = isKetua ? (data?.kepala_nip || "Data Belum Diisi") : null;
  const displayTelepon = (isKetua ? data?.kepala_telepon : data?.pic_telepon) || "Data Belum Diisi";

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            {isKetua ? "Informasi Ketua Kontingen" : "Informasi PIC / Operator"}
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Nama Lengkap
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {displayNama}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Jabatan
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {displayJabatan}
              </p>
            </div>

            {isKetua && (
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  NIP
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {displayNip}
                </p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Nomor Telepon
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {displayTelepon}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto lg:self-start"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Edit
        </button>
      </div>

      {/* Modal Edit */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[520px] mx-auto m-6 sm:m-10"
      >
        <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-6 sm:p-10 dark:bg-gray-900">
          <div className="pr-10">
            <h4 className="mb-2 text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit — {isKetua ? "Ketua Kontingen" : "PIC / Operator"}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Ubah informasi pribadi. Field yang tidak diubah akan tetap tersimpan.
            </p>
          </div>

          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="custom-scrollbar max-h-[420px] overflow-y-auto pr-2">
              {/* Foto Profil */}
              <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90">
                Foto Profil
              </h5>
              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 sm:w-28 sm:h-28 overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-700 mb-4">
                  <img
                    src={previewUrl}
                    alt="Preview Foto Profil"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.currentTarget.src = "/images/user/placeholder.jpg";
                    }}
                  />
                </div>
                <Label>Ubah Foto Profil</Label>
                <FileInput onChange={handleFileChange} className="max-w-xs mt-2" />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Format: JPG, PNG • Maks. 2MB
                </p>
              </div>

              {/* Informasi Pribadi */}
              <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90">
                Informasi Pribadi
              </h5>

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2">
                  <Label>Nama Lengkap</Label>
                  <Input
                    type="text"
                    name="namaLengkap"
                    value={formData.namaLengkap}
                    onChange={handleChange}
                    placeholder="Nama lengkap"
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Jabatan</Label>
                  <Input
                    type="text"
                    name="jabatan"
                    value={formData.jabatan}
                    onChange={handleChange}
                    placeholder="Jabatan"
                  />
                </div>

                {isKetua && (
                  <div className="col-span-2 lg:col-span-1">
                    <Label>NIP</Label>
                    <Input
                      type="text"
                      name="nip"
                      value={formData.nip}
                      onChange={handleChange}
                      placeholder="NIP"
                    />
                  </div>
                )}

                <div className="col-span-2 lg:col-span-1">
                  <Label>Nomor Telepon</Label>
                  <PhoneInput
                    selectPosition="start"
                    countries={[{ code: "ID", label: "+62" }]}
                    value={formData.nomorTelepon}
                    onChange={handlePhoneChange}
                    placeholder="8979819142"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal} disabled={loading}>
                Tutup
              </Button>
              <Button size="sm" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
