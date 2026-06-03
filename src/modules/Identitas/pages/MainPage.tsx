import { useState, useEffect, useCallback } from "react";
import {
  identitasService,
  kontingenService,
  kontingenIdentitasService,
  Identitas,
} from "../service";
import { useAuth } from "../../../context/AuthContext";
import { useTerritory } from "../../../context/TerritoryContext";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserMetaCard";
import UserAddressCard from "../components/UserAddressCard";
import IdentitasEditModal from "../components/IdentitasEditModal";
import KontingenCreateModal from "../components/KontingenCreateModal";

/** Cek apakah user adalah superadmin — handle semua format role dari backend */
function checkSuperAdmin(user: ReturnType<typeof useAuth>["user"]): boolean {
  if (!user) return false;
  // Format 1: role sebagai object { name: "superadmin" }
  const roleName = (user.role?.name ?? "").toLowerCase();
  if (roleName === "superadmin") return true;
  // Format 2: territories lebih dari 1 (superadmin punya semua territory)
  // ini fallback jika role belum tersimpan dengan benar
  if (user.territories && user.territories.length > 5) return true;
  return false;
}

export default function MainPage() {
  const { user } = useAuth();
  const { currentTerritory } = useTerritory();

  const isSuperAdmin = checkSuperAdmin(user);

  const [identitas, setIdentitas] = useState<Identitas | null>(null);
  const [kontingenId, setKontingenId] = useState<number | null>(null);
  const [kontingenTidakAda, setKontingenTidakAda] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  /* ─────────────────────────────────────────────────────────
     ADMIN BIASA
     Pakai GET /admin/identitas — otomatis dari JWT token
     Territory selector hanya untuk tampilan, tidak mempengaruhi
     endpoint karena backend sudah tahu kontingen dari token
  ───────────────────────────────────────────────────────── */
  const fetchAsAdmin = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIdentitas(null);
    setKontingenId(null);
    setKontingenTidakAda(false);

    try {
      const res = await identitasService.get();
      // res.data sudah null jika backend kembalikan {} (belum diisi)
      if (res.data) {
        setIdentitas(res.data);
        setKontingenId(res.data.kontingen_id);
      } else {
        // Data belum diisi — kontingen ada (dari JWT) tapi identitas kosong
        // Kita set kontingenId dari JWT tidak bisa langsung, tapi
        // PUT /admin/identitas akan upsert otomatis jadi tidak perlu ID
        setIdentitas(null);
        setKontingenId(-1); // sentinel: kontingen ada tapi identitas kosong
      }
    } catch (err: any) {
      console.error("❌ GET /admin/identitas error:", err);
      if (err.response?.status === 404) {
        setIdentitas(null);
        setKontingenId(-1);
      } else {
        setError(err.response?.data?.message || err.message || "Gagal memuat data.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* ─────────────────────────────────────────────────────────
     SUPERADMIN
     Territory selector menentukan data yang ditampilkan:
     GET /admin/kontingen/territory/:id → dapat kontingen_id
     GET /admin/kontingen-identitas/kontingen/:id → data identitas
  ───────────────────────────────────────────────────────── */
  const fetchAsSuperAdmin = useCallback(async (territoryId: number) => {
    setLoading(true);
    setError(null);
    setIdentitas(null);
    setKontingenId(null);
    setKontingenTidakAda(false);

    try {
      // Step 1 — cari kontingen dari territory
      let kontingen;
      try {
        const res = await kontingenService.getByTerritoryId(territoryId);
        kontingen = res.data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          setKontingenTidakAda(true);
          return;
        }
        throw err;
      }

      if (!kontingen?.id) {
        setKontingenTidakAda(true);
        return;
      }

      setKontingenId(kontingen.id);

      // Step 2 — ambil identitas dari kontingen_id
      try {
        const res = await kontingenIdentitasService.getByKontingenId(kontingen.id);
        const raw = res.data;
        if (Array.isArray(raw)) {
          setIdentitas(raw.length > 0 ? raw[0] : null);
        } else {
          setIdentitas((raw as Identitas) ?? null);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setIdentitas(null); // kontingen ada, identitas belum diisi
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error("❌ fetchAsSuperAdmin error:", err);
      setError(err.response?.data?.message || err.message || "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ─────────────────────────────────────────────────────────
     Trigger fetch saat territory berubah atau role berubah
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isSuperAdmin) {
      if (currentTerritory?.id) {
        fetchAsSuperAdmin(currentTerritory.id);
      }
    } else {
      // Admin biasa: fetch saat mount, tidak perlu tunggu territory
      fetchAsAdmin();
    }
  }, [isSuperAdmin, currentTerritory?.id, fetchAsSuperAdmin, fetchAsAdmin]);

  const handleUpdateSuccess = (updated: Identitas) => {
    setIdentitas(updated);
    if (updated.kontingen_id) setKontingenId(updated.kontingen_id);
  };

  const handleCreateSuccess = (newIdentitas: Identitas) => {
    setKontingenTidakAda(false);
    setKontingenId(newIdentitas.kontingen_id);
    setIdentitas(newIdentitas);
  };

  /* ── Belum pilih territory (superadmin saja) ─────────── */
  if (isSuperAdmin && !currentTerritory) {
    return (
      <>
        <PageMeta title="Identitas Kontingen" description="Kelola data identitas kontingen" />
        <PageBreadcrumb pageTitle="Identitas Kontingen" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Pilih wilayah dari selector di atas untuk melihat data.
          </p>
        </div>
      </>
    );
  }

  /* ── Loading ─────────────────────────────────────────── */
  if (loading) {
    return (
      <>
        <PageMeta title="Identitas Kontingen" description="Kelola data identitas kontingen" />
        <PageBreadcrumb pageTitle="Identitas Kontingen" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Memuat data{currentTerritory ? ` ${currentTerritory.name}` : ""}...
            </p>
          </div>
        </div>
      </>
    );
  }

  /* ── Error ───────────────────────────────────────────── */
  if (error) {
    return (
      <>
        <PageMeta title="Identitas Kontingen" description="Kelola data identitas kontingen" />
        <PageBreadcrumb pageTitle="Identitas Kontingen" />
        <div className="text-center py-20 px-4">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() =>
              isSuperAdmin && currentTerritory
                ? fetchAsSuperAdmin(currentTerritory.id)
                : fetchAsAdmin()
            }
            className="px-5 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm"
          >
            Coba Lagi
          </button>
        </div>
      </>
    );
  }

  /* ── Kontingen belum terdaftar (superadmin) ──────────── */
  if (kontingenTidakAda) {
    return (
      <>
        <PageMeta title="Identitas Kontingen" description="Kelola data identitas kontingen" />
        <PageBreadcrumb pageTitle="Identitas Kontingen" />
        <div className="text-center py-20 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Kontingen Belum Terdaftar
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Kontingen untuk wilayah{" "}
            <strong>{currentTerritory?.name}</strong> belum terdaftar di sistem.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Daftarkan Kontingen
          </button>
        </div>

        <KontingenCreateModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          territoryId={currentTerritory!.id}
          territoryName={currentTerritory!.name}
          onSuccess={handleCreateSuccess}
        />
      </>
    );
  }

  /* ── Main ────────────────────────────────────────────── */
  // canEdit: admin biasa selalu bisa (sentinel -1), superadmin butuh kontingenId real
  const canEdit = kontingenId !== null;

  return (
    <>
      <PageMeta title="Identitas Kontingen" description="Kelola data identitas kontingen" />
      <PageBreadcrumb pageTitle="Identitas Kontingen" />

      <div className="space-y-6 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            {currentTerritory && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {currentTerritory.name}
              </p>
            )}
            {identitas?.updated_at && (
              <p className="text-xs text-gray-400 mt-0.5">
                Terakhir diperbarui:{" "}
                {new Date(identitas.updated_at).toLocaleString("id-ID", {
                  day: "2-digit", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            )}
          </div>

          {canEdit && (
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.05]"
            >
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-current">
                <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z" />
              </svg>
              {identitas ? "Edit Identitas" : "Isi Data Identitas"}
            </button>
          )}
        </div>

        {/* Banner identitas belum diisi */}
        {!identitas && (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 dark:border-yellow-800/50 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Data identitas{currentTerritory ? ` untuk ${currentTerritory.name}` : ""} belum diisi.
              {canEdit && <> Klik <strong>Isi Data Identitas</strong> untuk mulai mengisi.</>}
            </p>
          </div>
        )}

        {/* Cards */}
        <UserMetaCard role="ketua" data={identitas} />
        <UserMetaCard role="operator" data={identitas} />
        <UserAddressCard data={identitas} />

      </div>

      {/* Modal edit/create */}
      {canEdit && (
        <IdentitasEditModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          data={identitas}
          kontingenId={kontingenId === -1 ? null : kontingenId}
          isSuperAdmin={isSuperAdmin}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </>
  );
}
