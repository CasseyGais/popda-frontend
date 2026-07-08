import MainPage from "./pages/MainPage";
import ProtectedRoute from "../Auth/components/ProtectedRoute";
import DashboardLayout from "../Dashboard/components/DashboardLayout";

export const profilRoutes = [
  {
    path: "/profil",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <MainPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
];
