import { useState, useEffect } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { useAuth } from "../../../context/AuthContext";
import { profilService, type ProfilUser } from "../service";
import { getAvatarUrl } from "../../../utils/auth-helpers";
import EditProfilModal from "../components/EditProfilModal";

export default function MainPage() {
  const { user: authUser, login } = useAuth();

  const [profil,  setProfil]  = useState<ProfilUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch data profil terkini dari backend
  useEffect(() => {
    if (!authUser?.id) return;
    setLoading(true);
    profilService.get(authUser.id)
      .then(setProfil)
      .catch(e => setError(e.message || "Gagal memuat profil"))
      .finally(() => setLoading(false));
  }, [authUser?.id]);

  // Setelah update sukses — refresh AuthContext agar header ikut terupdate
  const handleSuccess = async (updated: ProfilUser) => {
    setProfil(updated);
    // Sinkronisasi AuthContext — pertahankan token yang ada
    const token = localStorage.getItem("token") ?? "";
    await login(token, {
      ...updated,
      role: authUser?.role,
      kab_kota: authUser?.kab_kota,
      territories: authUser?.territories,
    });
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const initials = profil
    ? profil.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const avatarSrc = profil?.avatar ? getAvatarUrl(profil.avatar) : null;

  return (
    <>
      <PageMeta title="Profil Pengguna" description="Informasi akun pengguna POPDA 2026" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Profil Pengguna" />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20 px-5 py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Memuat profil...</span>
          </div>
        ) : profil ? (
          <div className="max-w-lg">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">

              {/* Cover + Avatar */}
              <div className="h-24 bg-gradient-to-r from-brand-500 to-brand-600" />
              <div className="px-6 pb-6">
                <div className="flex items-end justify-between -mt-10 mb-4">
                  {/* Avatar */}
                  <div className="relative">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={profil.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-gray-900 shadow">
                        {initials}
                      </div>
                    )}
                  </div>
                  {/* Tombol edit */}
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Profil
                  </button>
                </div>

                {/* Info */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{profil.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{profil.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Status</p>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        profil.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {profil.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Role</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {authUser?.role?.name ?? "—"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Terdaftar Sejak</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{fmtDate(profil.created_at)}</p>
                    </div>
                    {authUser?.kab_kota && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Kabupaten / Kota</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{authUser.kab_kota}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {profil && (
        <EditProfilModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          user={profil}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
