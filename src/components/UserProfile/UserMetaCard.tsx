// src/components/UserProfile/UserMetaCard.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { IdentitasKontingen } from "../../types/identitas";

interface UserMetaCardProps {
  role: "ketua" | "operator";
}

export default function UserMetaCard({ role }: UserMetaCardProps) {
  const { user } = useAuth();

  const [userData, setUserData] = useState({
    namaLengkap: "Memuat...",
    jabatan: role === "ketua" ? "Ketua Kontingen" : "PIC/Operator",
    location: user?.kab_kota || "Lokasi Tidak Diketahui",
    photo: "/images/user/placeholder.jpg",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching identitas data for role:", role);
        const response = await api.get("/admin/identitas");
        console.log("API Response:", response.data);
        
        const data: IdentitasKontingen = response.data.data;
        console.log("Identitas data:", data);
        
        // Jika belum ada identitas
        if (!data || Object.keys(data).length === 0) {
          // Data belum ada, tampilkan default
          setUserData({
            namaLengkap: "Data Belum Diisi",
            jabatan:
              role === "ketua" ? "Ketua Kontingen" : "PIC/Operator",
            location: user?.kab_kota || "Lokasi Tidak Diketahui",
            photo: "/images/user/placeholder.jpg",
          });
          return;
        }

        // Tentukan data berdasarkan role
        const isKetua = role === "ketua";

        const nama = isKetua ? data.kepala_nama : data.pic_nama;
        const jabatan = isKetua
          ? data.kepala_jabatan
          : data.pic_jabatan;
        const foto = isKetua
          ? data.kepala_foto
          : data.pic_foto;

        setUserData({
          namaLengkap: nama || "Nama Tidak Ditemukan",
          jabatan:
            jabatan ||
            (isKetua ? "Ketua Kontingen" : "PIC/Operator"),
          location: user?.kab_kota || "Lokasi Tidak Diketahui",
          photo: foto
            ? `http://localhost:8000${foto}`
            : "/images/user/placeholder.jpg",
        });
      } catch (error) {
        console.error("Gagal ambil data meta:", error);

        // Fallback jika API error
        setUserData({
          namaLengkap: user?.name || "Error Loading Data",
          jabatan:
            role === "ketua" ? "Ketua Kontingen" : "PIC/Operator",
          location: user?.kab_kota || "Lokasi Tidak Diketahui",
          photo: user?.avatar
            ? `http://localhost:8000${user.avatar}`
            : "/images/user/placeholder.jpg",
        });
      }
    };

    fetchData();
  }, [role, user]);

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
            <img
              src={userData.photo}
              alt="user"
              className="object-cover w-full h-full"
              onError={(e) => {
                e.currentTarget.src =
                  "/images/user/placeholder.jpg";
              }}
            />
          </div>

          <div className="order-3 xl:order-2">
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {userData.namaLengkap}
            </h4>

            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userData.jabatan}
              </p>

              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userData.location}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}