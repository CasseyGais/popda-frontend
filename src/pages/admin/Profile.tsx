// src/pages/admin/Profile.tsx
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <>
      <PageMeta
        title="Profile | POPDA Admin"
        description="Profil pengguna POPDA Admin Dashboard"
      />
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-5 text-xl font-bold text-gray-800 dark:text-white/90">
            Profil Pengguna
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Nama Lengkap
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {user?.name || "-"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Email
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {user?.email || "-"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                ID Pengguna
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {user?.id || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
