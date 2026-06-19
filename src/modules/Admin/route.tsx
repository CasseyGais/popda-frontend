import ProtectedRoute from "../Auth/components/ProtectedRoute";
import DashboardLayout from "../Dashboard/components/DashboardLayout";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";
import TerritoriesPage from "./pages/TerritoriesPage";
import PermissionsPage from "./pages/PermissionsPage";
import ModulesPage from "./pages/ModulesPage";
import CaborPage from "./pages/CaborPage";
import NomorPage from "./pages/NomorPage";
import PengaturanTahapPage from "./pages/PengaturanTahapPage";
import ValidasiPendaftaranPage from "./pages/ValidasiPendaftaranPage";

const wrap = (Page: React.ComponentType) => (
  <ProtectedRoute>
    <DashboardLayout>
      <Page />
    </DashboardLayout>
  </ProtectedRoute>
);

export const adminRoutes = [
  { path: "/admin/users",                element: wrap(UsersPage) },
  { path: "/admin/roles",                element: wrap(RolesPage) },
  { path: "/admin/territories",          element: wrap(TerritoriesPage) },
  { path: "/admin/permissions",          element: wrap(PermissionsPage) },
  { path: "/admin/modules",              element: wrap(ModulesPage) },
  { path: "/admin/cabor",                element: wrap(CaborPage) },
  { path: "/admin/nomor",                element: wrap(NomorPage) },
  { path: "/admin/pengaturan-tahap",     element: wrap(PengaturanTahapPage) },
  { path: "/admin/validasi-pendaftaran", element: wrap(ValidasiPendaftaranPage) },
];
