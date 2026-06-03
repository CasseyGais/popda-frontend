import Main from "./pages/MainPage";
import ProtectedRoute from "../Auth/components/ProtectedRoute";
import DashboardLayout from "../Dashboard/components/DashboardLayout";

export const bysportRoutes = [
  {
    path: "/atlet-by-sports",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <Main />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
];
