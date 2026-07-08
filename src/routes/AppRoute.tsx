import { Routes, Route, Navigate } from "react-router-dom";
import { authRoutes }      from "../modules/Auth/route";
import { dashboardRoutes } from "../modules/Dashboard/route";
import { adminRoutes }     from "../modules/Admin/route";
import ProtectedRoute      from "../modules/Auth/components/ProtectedRoute";
import ForbiddenPage       from "../modules/Auth/components/ForbiddenPage";
import DashboardLayout     from "../modules/Dashboard/components/DashboardLayout";

// Tahap modules
import BysportMain  from "../modules/Bysport/pages/MainPage";
import BynumberMain from "../modules/Bynumber/pages/MainPage";
import BynameMain   from "../modules/Byname/pages/MainPage";

// Identitas
import IdentitasMain from "../modules/Identitas/pages/MainPage";

// Rekap Pendaftaran
import RekapMain from "../modules/RekapPendaftaran/pages/MainPage";

// Sertifikat
import SertifikatMain from "../modules/Sertifikat/pages/MainPage";

// Laporan Pertandingan
import LaporanPertandinganMain from "../modules/LaporanPertandingan/pages/MainPage";

// Profil
import ProfilMain from "../modules/Profil/pages/MainPage";

/** Wrap page dalam ProtectedRoute + DashboardLayout */
const protect = (Page: React.ComponentType, permission?: string, blockedRoles?: string[]) => (
  <ProtectedRoute requiredPermission={permission} blockedRoles={blockedRoles}>
    <DashboardLayout>
      <Page />
    </DashboardLayout>
  </ProtectedRoute>
);

/** Role STAFF_LAPANGAN hanya boleh akses: /laporan-pertandingan, /sertifikat, /profil */
const STAFF_LAPANGAN_BLOCKED = ["STAFF_LAPANGAN"];

const AppRoutes = () => (
  <Routes>
    {/* Default */}
    <Route path="/" element={<Navigate to="/login" replace />} />

    {/* 403 Forbidden */}
    <Route path="/403" element={<ForbiddenPage />} />

    {/* Auth */}
    {authRoutes.map((r: any, i: number) => (
      <Route key={`auth-${i}`} path={r.path} element={r.element} />
    ))}

    {/* Dashboard */}
    {dashboardRoutes.map((r: any, i: number) => (
      <Route key={`dash-${i}`} path={r.path} element={r.element} />
    ))}

    {/* Admin (Master Data + Settings + Pengaturan Tahap + Validasi) */}
    {adminRoutes.map((r: any, i: number) => (
      <Route key={`admin-${i}`} path={r.path} element={r.element} />
    ))}

    {/* Identitas Kontingen — STAFF_LAPANGAN tidak boleh akses */}
    <Route path="/identitas-kontingen" element={protect(IdentitasMain, undefined, STAFF_LAPANGAN_BLOCKED)} />

    {/* Tahap 1 — Entry By Sport — STAFF_LAPANGAN tidak boleh akses */}
    <Route path="/atlet-by-sports"  element={protect(BysportMain,  "trx_kontingen_cabor.read", STAFF_LAPANGAN_BLOCKED)} />

    {/* Tahap 2 — Entry By Number — STAFF_LAPANGAN tidak boleh akses */}
    <Route path="/atlet-by-numbers" element={protect(BynumberMain, "trx_kontingen_nomor.read", STAFF_LAPANGAN_BLOCKED)} />

    {/* Tahap 3 — Entry By Name — STAFF_LAPANGAN tidak boleh akses */}
    <Route path="/atlet-by-names"   element={protect(BynameMain,   "trx_pendaftaran_atlet.read", STAFF_LAPANGAN_BLOCKED)} />

    {/* Rekap Pendaftaran — STAFF_LAPANGAN tidak boleh akses */}
    <Route path="/rekap-pendaftaran" element={protect(RekapMain, undefined, STAFF_LAPANGAN_BLOCKED)} />

    {/* Sertifikat — semua role yang sudah login (termasuk STAFF_LAPANGAN) */}
    <Route path="/sertifikat" element={protect(SertifikatMain)} />

    {/* Laporan Pertandingan — semua role yang sudah login (termasuk STAFF_LAPANGAN) */}
    <Route path="/laporan-pertandingan" element={protect(LaporanPertandinganMain)} />

    {/* Profil — semua role yang sudah login (termasuk STAFF_LAPANGAN) */}
    <Route path="/profil" element={protect(ProfilMain)} />

    {/* 404 fallback */}
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default AppRoutes;
