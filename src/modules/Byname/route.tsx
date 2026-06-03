import MainPage from "./pages/MainPage";
import ProtectedRoute from "../Auth/components/ProtectedRoute";
import DashboardLayout from "../Dashboard/components/DashboardLayout";

export const bynameRoutes = [
  {
    path: "/atlet-by-names",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <MainPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
];
