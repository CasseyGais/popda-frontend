import PageMeta from "../../../components/common/PageMeta";
import AtletMetrics from "../../../components/popda/AtletMetrics";
import TargetKabKota from "../../../components/popda/TargetKabKota";
import RecentPendaftaran from "../../../components/popda/RecentPendaftaran";
import NavButton from "../../../components/popda/NavButton";
import StatusValidasi from "../../../components/popda/StatusValidasi";
import { useAuth } from "../../../context/AuthContext";

export default function Dashboard() {
  const { user, can } = useAuth();
  const isStaffLapangan = user?.role?.name === "STAFF_LAPANGAN";
  const isSuperAdmin    = can("*");

  return (
    <>
      <PageMeta
        title="SPORTIF"
        description="POPDA XII Cilegon"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">

        {/* Kolom kiri: Metrik + Tindakan Cepat */}
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <AtletMetrics />

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] min-h-[210px] md:min-h-[230px] xl:min-h-[250px]">
            <h3 className="mb-3 text-xl font-bold text-gray-800 dark:text-white/90">
              Tindakan Cepat
            </h3>

            {isStaffLapangan ? (
              /* STAFF_LAPANGAN — Laporan Pertandingan & Sertifikat */
              <div className="grid grid-cols-2 gap-4">
                <NavButton
                  to="/laporan-pertandingan"
                  label="Laporan Pertandingan"
                  iconType="docs"
                  color="primary"
                />
                <NavButton
                  to="/sertifikat"
                  label="Cetak Sertifikat"
                  iconType="page"
                  color="success"
                />
              </div>
            ) : isSuperAdmin ? (
              /* SUPERADMIN — Validasi Pendaftaran & Rekap Pendaftaran */
              <div className="grid grid-cols-2 gap-4">
                <NavButton
                  to="/admin/validasi-pendaftaran"
                  label="Validasi Pendaftaran"
                  iconType="task"
                  color="warning"
                />
                <NavButton
                  to="/rekap-pendaftaran"
                  label="Rekap Pendaftaran"
                  iconType="docs"
                  color="info"
                />
              </div>
            ) : (
              /* ADMIN — Identitas Kontingen + Mulai Pendaftaran */
              <div className="grid grid-cols-2 gap-4">
                <NavButton
                  to="/identitas-kontingen"
                  label="Identitas Kontingen"
                  iconType="group"
                  color="info"
                />
                <NavButton
                  to="/atlet-by-sports"
                  label="Mulai Pendaftaran"
                  iconType="form"
                  color="primary"
                />
              </div>
            )}
          </div>
        </div>

        {/* Kolom kanan: Target Kab/Kota */}
        <div className="col-span-12 xl:col-span-5">
          <TargetKabKota />
        </div>

        {/* Status Validasi Pendaftaran — full width, disembunyikan untuk STAFF_LAPANGAN */}
        {!isStaffLapangan && (
          <div className="col-span-12">
            <StatusValidasi />
          </div>
        )}

        {/* Jadwal Tahap Pendaftaran — full width */}
        <div className="col-span-12">
          <RecentPendaftaran />
        </div>

      </div>
    </>
  );
}
