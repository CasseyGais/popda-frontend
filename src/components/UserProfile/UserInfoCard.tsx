// src/components/UserProfile/UserInfoCard.tsx
import { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { EnvelopeIcon } from "../../icons";
import PhoneInput from "../form/group-input/PhoneInput";
import FileInput from "../form/input/FileInput";
import api from "../../lib/api";
import { IdentitasKontingen } from "../../types/identitas";

interface UserInfoCardProps {
  role: "ketua" | "operator";
}

export default function UserInfoCard({ role }: UserInfoCardProps) {
  const { isOpen, openModal, closeModal } = useModal();

  const [formData, setFormData] = useState({
    namaLengkap: "",
    jabatan: "",
    nip: "",
    email: "",
    nomorTelepon: "",
  });

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("/images/user/placeholder.jpg");

  // Fetch data dari backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/admin/identitas");
        const data: IdentitasKontingen = response.data.data;

        if (!data || Object.keys(data).length === 0) {
          // Data belum ada, biarkan kosong
          setFormData({
            namaLengkap: "",
            jabatan: role === "ketua" ? "Ketua Kontingen" : "PIC/Operator",
            nip: "",
            email: "",
            nomorTelepon: "",
          });
          return;
        }

        // Ambil data sesuai role
        const target = role === "ketua" 
          ? {
              nama: data.kepala_nama,
              jabatan: data.kepala_jabatan,
              nip: data.kepala_nip,
              telepon: data.kepala_telepon,
              foto: data.kepala_foto
            }
          : {
              nama: data.pic_nama,
              jabatan: data.pic_jabatan,
              nip: "",
              telepon: data.pic_telepon,
              foto: data.pic_foto
            };

        setFormData({
          namaLengkap: target.nama || "",
          jabatan: target.jabatan || (role === "ketua" ? "Ketua Kontingen" : "PIC/Operator"),
          nip: target.nip || "",
          email: data.email_instansi || "",
          nomorTelepon: target.telepon || "",
        });

        if (target.foto) {
          setPreviewUrl(`${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}${target.foto}`);
        }
      } catch (error) {
        console.error("Gagal ambil data:", error);
      }
    };

    fetchData();
  }, [role]);

  // Hapus useEffect yang auto-refresh saat modal dibuka untuk mencegah reset input

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
      const formDataToSend = new FormData();
      
      // Sesuaikan field names dengan backend
      if (role === "ketua") {
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
      
      // Field instansi
      formDataToSend.append("email_instansi", formData.email);
      formDataToSend.append("phone_instansi", formData.nomorTelepon);

      const response = await api.put("/admin/identitas", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Data berhasil disimpan!");
      
      // Refresh data dari response
      const updatedData: IdentitasKontingen = response.data.data;
      if (updatedData) {
        const target = role === "ketua" 
          ? {
              nama: updatedData.kepala_nama,
              jabatan: updatedData.kepala_jabatan,
              nip: updatedData.kepala_nip,
              telepon: updatedData.kepala_telepon,
              foto: updatedData.kepala_foto
            }
          : {
              nama: updatedData.pic_nama,
              jabatan: updatedData.pic_jabatan,
              nip: "",
              telepon: updatedData.pic_telepon,
              foto: updatedData.pic_foto
            };

        setFormData({
          namaLengkap: target.nama || "",
          jabatan: target.jabatan || (role === "ketua" ? "Ketua Kontingen" : "PIC/Operator"),
          nip: target.nip || "",
          email: updatedData.email_instansi || "",
          nomorTelepon: target.telepon || "",
        });

        if (target.foto) {
          setPreviewUrl(`${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}${target.foto}`);
        }
      }
      
      closeModal();
      
      // Auto-reload halaman
      window.location.href = "/identitas-kontingen";
    } catch (error: any) {
      console.error("Gagal simpan:", error.response?.data || error.message);
      alert(
        "Gagal menyimpan data: " +
          (error.response?.data?.error || "Cek console")
      );
    }
  };

  const isKetua = role === "ketua";

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Informasi Pribadi
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Nama Lengkap
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {formData.namaLengkap || "Data Belum Diisi"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Jabatan
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {formData.jabatan || "Data Belum Diisi"}
              </p>
            </div>

            {isKetua && (
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  NIP
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formData.nip || "Data Belum Diisi"}
                </p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Nomor Telepon
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {formData.nomorTelepon || "Data Belum Diisi"}
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

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[520px] mx-auto m-6 sm:m-10"
      >
        <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-6 sm:p-10 dark:bg-gray-900">
          <div className="pr-10">
            <h4 className="mb-2 text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit - {role === "ketua" ? "Ketua Kontingen" : "PIC/Operator"}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Ubah informasi pribadi sesuai dengan data diri anda!
            </p>
          </div>

          <form 
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault(); // Mencegah auto-submit
              handleSave(); // Hanya save saat tombol Simpan diklik
            }}
          >
            <div className="custom-scrollbar max-h-[420px] overflow-y-auto pr-2">
              <div>
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
                  <FileInput
                    onChange={handleFileChange}
                    className="max-w-xs mt-2"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Format: JPG, PNG • Maks. 2MB
                  </p>
                </div>

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
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Jabatan</Label>
                    <Input
                      type="text"
                      name="jabatan"
                      value={formData.jabatan}
                      onChange={handleChange}
                    />
                  </div>

                  {role === "ketua" && (
                    <div className="col-span-2 lg:col-span-1">
                      <Label>NIP</Label>
                      <Input
                        type="text"
                        name="nip"
                        value={formData.nip}
                        onChange={handleChange}
                      />
                    </div>
                  )}

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email</Label>
                    <div className="relative">
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="contoh@domain.go.id"
                        className="pl-[62px]"
                      />
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                        <EnvelopeIcon className="size-6" />
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Nomor Telepon</Label>
                    <PhoneInput
                      selectPosition="start"
                      countries={[
                        { code: "ID", label: "+62" },
                        { code: "US", label: "+1" },
                        { code: "GB", label: "+44" },
                        { code: "AU", label: "+61" },
                      ]}
                      value={formData.nomorTelepon}
                      onChange={handlePhoneChange}
                      placeholder="Contoh: 8979819142 (tanpa 0 awal untuk +62)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Tutup
              </Button>
              <Button size="sm" onClick={handleSave}>
                Simpan
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
