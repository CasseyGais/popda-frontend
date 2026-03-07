// src/pages/admin/DashboardHomeAdmin.tsx
import PageMeta from "../../components/common/PageMeta";
import AtletMetrics from "../../components/popda/AtletMetrics";
import TargetKabKota from "../../components/popda/TargetKabKota";
import RecentPendaftaran from "../../components/popda/RecentPendaftaran";
import NavButton from "../../components/popda/NavButton";

export default function DashboardHomeAdmin() {
  return (
    <>
      <PageMeta
        title="SPORTIF"
        description="POPDA XII Cilegon"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          {/* Metrik utama */}
          <AtletMetrics />

          {/* Tindakan Cepat - tinggi dikontrol ketat biar bottom sejajar */}
<div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] min-h-[210px] md:min-h-[230px] xl:min-h-[250px]">
  <h3 className="mb-3 text-xl font-bold text-gray-800 dark:text-white/90">
    Tindakan Cepat
  </h3>
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
    <NavButton
      to="/atlet-by-sports"
      label="Mulai Pendaftaran"
      iconType="form"
      color="primary"
    />
  </div>
</div>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <TargetKabKota />
        </div>

        <div className="col-span-12">
          <RecentPendaftaran />
        </div>
      </div>
    </>
  );
}