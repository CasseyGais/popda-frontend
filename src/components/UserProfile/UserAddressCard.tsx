// src/components/UserProfile/UserAddressCard.tsx
import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import PhoneInput from "../form/group-input/PhoneInput";
import api from "../../lib/api";
import { IdentitasKontingen } from "../../types/identitas";

export default function UserAddressCard() {
  const { isOpen, openModal, closeModal } = useModal();

  const [formData, setFormData] = useState({
    alamatInstansi: "",
    emailResmi: "",
    nomorTeleponInstansi: "",
  });

  const [loading, setLoading] = useState(true);

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      const response = await api.get("/admin/identitas");
      const data: IdentitasKontingen = response.data.data;

      if (!data || Object.keys(data).length === 0) {
        setFormData({
          alamatInstansi: "",
          emailResmi: "",
          nomorTeleponInstansi: "",
        });
        return;
      }

      setFormData({
        alamatInstansi: data.alamat || "",
        emailResmi: data.email_instansi || "",
        nomorTeleponInstansi: data.phone_instansi || "",
      });
    } catch (error) {
      console.error("Gagal mengambil data instansi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= HANDLE CHANGE =================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ================= HANDLE SAVE =================
  const handleSave = async () => {
    try {
      const formDataToSend = new FormData();

      // WAJIB sesuai handler backend Anda
      formDataToSend.append("alamat", formData.alamatInstansi);
      formDataToSend.append("emailInstansi", formData.emailResmi);
      formDataToSend.append("phoneInstansi", formData.nomorTeleponInstansi);

      const response = await api.put(
        "/admin/identitas",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedData: IdentitasKontingen = response.data.data;

      if (updatedData) {
        setFormData({
          alamatInstansi: updatedData.alamat || "",
          emailResmi: updatedData.email_instansi || "",
          nomorTeleponInstansi: updatedData.phone_instansi || "",
        });
      }

      alert("Informasi instansi berhasil disimpan ✅");
      closeModal();
      
      // Auto-reload halaman
      window.location.href = "/identitas-kontingen";
      
    } catch (error: any) {
      console.error("Gagal menyimpan:", error.response?.data || error);
      alert(
        "Gagal menyimpan data: " +
          (error.response?.data?.error || "Cek console")
      );
    }
  };

  if (loading) {
    return <div className="p-5 text-center">Memuat data instansi...</div>;
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="w-full">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Informasi Instansi
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              {/* Alamat Instansi - full width */}
              <div className="col-span-1 lg:col-span-2">
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Alamat Instansi
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 break-words">
                  {formData.alamatInstansi || "Data Belum Diisi"}
                </p>
              </div>

              {/* Nomor Telepon Instansi - sebelah Alamat di desktop */}
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Nomor Telepon Instansi
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formData.nomorTeleponInstansi || "Data Belum Diisi"}
                </p>
              </div>

              {/* Email Resmi - di bawah */}
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Email Resmi
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 break-words">
                  {formData.emailResmi || "Data Belum Diisi"}
                </p>
              </div>
            </div>
          </div>

          <button
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
      </div>

      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[520px] mx-auto m-6 sm:m-10"
      >
        <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-6 sm:p-10 dark:bg-gray-900">
          <div className="pr-10">
            <h4 className="mb-2 text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Informasi Instansi
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Ubah informasi instansi sesuai dengan data resmi anda!
            </p>
          </div>

          <form className="flex flex-col">
            <div className="custom-scrollbar max-h-[420px] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2">
                  <Label>Alamat Instansi</Label>
                  <Input
                    type="text"
                    name="alamatInstansi"
                    value={formData.alamatInstansi}
                    onChange={handleChange}
                    placeholder="Jl. Raya Serang - Pandeglang Km. 5"
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Nomor Telepon Instansi</Label>
                  <PhoneInput
                    selectPosition="start"
                    countries={[
                      { code: "ID", label: "+62" },
                    ]}
                    value={formData.nomorTeleponInstansi}
                    onChange={(value) => setFormData(prev => ({ ...prev, nomorTeleponInstansi: value }))}
                    placeholder="+62 254 123 4567"
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Email Resmi</Label>
                  <Input
                    type="email"
                    name="emailResmi"
                    value={formData.emailResmi}
                    onChange={handleChange}
                    placeholder="dinaspendidikan@kabupatenlebak.go.id"
                  />
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
    </>
  );
}