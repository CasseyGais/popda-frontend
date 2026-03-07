 // src/pages//admin/Identitas.tsx 
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import UserMetaCard from "../../components/UserProfile/UserMetaCard";
import UserInfoCard from "../../components/UserProfile/UserInfoCard";
import UserAddressCard from "../../components/UserProfile/UserAddressCard";
import PageMeta from "../../components/common/PageMeta";

export default function UserProfiles() {
  return (
    <>
      <PageMeta
        title="SPORTIF - Identitas Kontingen"
        description="Halaman identitas kontingen untuk pengelolaan data Ketua Kontingen dan PIC/Operator"
      />
      <PageBreadcrumb pageTitle="Identitas Kontingen" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="space-y-10">
          {/* Bagian Ketua Kontingen */}
          <div>
            <UserMetaCard role="ketua" />
            <div className="mt-6">
              <UserInfoCard role="ketua" />
            </div>
          </div>

          {/* Bagian PIC/Operator */}
          <div>
            <UserMetaCard role="operator" />
            <div className="mt-6">
              <UserInfoCard role="operator" />
            </div>
          </div>

          {/* Informasi Instansi */}
          <div className="mt-10">
            <UserAddressCard />
          </div>
        </div>
      </div>
    </>
  );
}