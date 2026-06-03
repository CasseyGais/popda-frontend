import { Routes, Route, Navigate } from "react-router-dom";
import { authRoutes } from "../modules/Auth/route";
import { dashboardRoutes } from "../modules/Dashboard/route";
import ProtectedRoute from "../modules/Auth/components/ProtectedRoute";
import ForbiddenPage from "../modules/Auth/components/ForbiddenPage";
import DashboardLayout from "../modules/Dashboard/components/DashboardLayout";

// Tahap modules
import BysportMain   from "../modules/Bysport/pages/MainPage";
import BynumberMain  from "../modules/Bynumber/pages/MainPage";
import BynameMain    from "../modules/Byname/pages/MainPage";

// Identitas
import IdentitasMain from "../modules/Identitas/pages/MainPage";

// Admin pages
import UsersPage       from "../modules/Admin/pages/UsersPage";
import RolesPage       from "../modules/Admin/pages/RolesPage";
import TerritoriesPage from "../modules/Admin/pages/TerritoriesPage";
import PermissionsPage from "../modules/Admin/pages/PermissionsPage";
import ModulesPage     from "../modules/Admin/pages/ModulesPage";
import CaborPage       from "../modules/Admin/pages/CaborPage";
import NomorPage       from "../modules/Admin/pages/NomorPage";

/** Wrap page dalam ProtectedRoute + DashboardLayout */
const protect = (
  Page: React.ComponentType,
  permission?: string
) => (
  <ProtectedRoute requiredPermission={permission}>
    <DashboardLayout>
      <Page />
    </DashboardLayout>
  </ProtectedRoute>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Default — redirect ke login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 403 Forbidden */}
      <Route path="/403" element={<ForbiddenPage />} />

      {/* Auth (login, dll) */}
      {authRoutes.map((route: any, i: number) => (
        <Route key={`auth-${i}`} path={route.path} element={route.element} />
      ))}

      {/* Dashboard */}
      {dashboardRoutes.map((route: any, i: number) => (
        <Route key={`dashboard-${i}`} path={route.path} element={route.element} />
      ))}

      {/* Identitas Kontingen — hanya butuh login, tidak perlu permission khusus */}
      <Route
        path="/identitas-kontingen"
        element={protect(IdentitasMain)}
      />

      {/* Tahap 1 — Entry By Sport */}
      <Route
        path="/atlet-by-sports"
        element={protect(BysportMain, "trx_kontingen_cabor.read")}
      />

      {/* Tahap 2 — Entry By Number */}
      <Route
        path="/atlet-by-numbers"
        element={protect(BynumberMain, "trx_kontingen_nomor.read")}
      />

      {/* Tahap 3 — Entry By Name */}
      <Route
        path="/atlet-by-names"
        element={protect(BynameMain, "trx_pendaftaran_atlet.read")}
      />

      {/* Master Data */}
      <Route path="/admin/cabor"   element={protect(CaborPage,   "cabor.read")} />
      <Route path="/admin/nomor"   element={protect(NomorPage,   "nomor.read")} />

      {/* Settings */}
      <Route path="/admin/users"        element={protect(UsersPage,       "user.read")} />
      <Route path="/admin/roles"        element={protect(RolesPage,       "role.read")} />
      <Route path="/admin/territories"  element={protect(TerritoriesPage, "territory.read")} />
      <Route path="/admin/permissions"  element={protect(PermissionsPage, "permission.read")} />
      <Route path="/admin/modules"      element={protect(ModulesPage,     "permission.read")} />

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
