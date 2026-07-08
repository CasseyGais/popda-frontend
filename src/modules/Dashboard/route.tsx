import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "../Auth/components/ProtectedRoute";

export const dashboardRoutes = [
    {
        path: "/dashboard",
        element: (
            <ProtectedRoute>
                <DashboardLayout>
                    <Dashboard />
                </DashboardLayout>
            </ProtectedRoute>
        ),
    },
];
