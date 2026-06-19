import MainPage from "./pages/MainPage";
import ProtectedRoute from "../Auth/components/ProtectedRoute";
import DashboardLayout from "../Dashboard/components/DashboardLayout";

export const rekapPendaftaranRoutes = [
  {
    path: "/rekap-pendaftaran",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <MainPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
];
