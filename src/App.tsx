// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";

// Layout
import AppLayout from "./layout/AppLayout";

// Auth Pages
import SignIn from "./pages/AuthPages/SignIn";

// Protected Route
import ProtectedRoute from "./routes/ProtectedRoute.tsx";

// Admin Pages
import DashboardHomeAdmin from "./pages/admin/DashboardHomeAdmin";
import Identitas from "./pages/admin/Identitas";
import AtletBySports from "./pages/admin/AtletBySports";
import AtletByNumbers from "./pages/admin/AtletByNumbers";
import AtletByNames from "./pages/admin/AtletByNames";
import Profile from "./pages/admin/Profile";

// Template Pages
import Calendar from "./pages/Calendar";
import Blank from "./pages/Blank";
import FormElements from "./pages/Forms/FormElements";
import BasicTables from "./pages/Tables/BasicTables";
import Alerts from "./pages/UiElements/Alerts";
import Avatars from "./pages/UiElements/Avatars";
import Badges from "./pages/UiElements/Badges";
import Buttons from "./pages/UiElements/Buttons";
import Images from "./pages/UiElements/Images";
import Videos from "./pages/UiElements/Videos";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";

export default function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignIn />} />

      {/* PROTECTED AREA */}
      <Route element={<AppLayout />}>

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["SUPERADMIN", "ADMIN", "STAFF_LAPANGAN"]}>
              <DashboardHomeAdmin />
            </ProtectedRoute>
          }
        />

        {/* IDENTITAS */}
        <Route
          path="/identitas-kontingen"
          element={
            <ProtectedRoute allowedRoles={["SUPERADMIN", "ADMIN"]}>
              <Identitas />
            </ProtectedRoute>
          }
        />

        {/* TAHAP I */}
        <Route
          path="/atlet-by-sports"
          element={
            <ProtectedRoute allowedRoles={["SUPERADMIN", "ADMIN"]}>
              <AtletBySports />
            </ProtectedRoute>
          }
        />

        {/* TAHAP II */}
        <Route
          path="/atlet-by-numbers"
          element={
            <ProtectedRoute allowedRoles={["SUPERADMIN", "ADMIN"]}>
              <AtletByNumbers />
            </ProtectedRoute>
          }
        />

        {/* TAHAP III */}
        <Route
          path="/atlet-by-names"
          element={
            <ProtectedRoute allowedRoles={["SUPERADMIN", "ADMIN"]}>
              <AtletByNames />
            </ProtectedRoute>
          }
        />

        {/* PROFILE */}
        <Route
          path="/profile/:type/:id"
          element={
            <ProtectedRoute allowedRoles={["SUPERADMIN", "ADMIN", "STAFF_LAPANGAN"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* TEMPLATE PAGES (SEMUA ROLE LOGIN BOLEH) */}
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/blank" element={<ProtectedRoute><Blank /></ProtectedRoute>} />
        <Route path="/form-elements" element={<ProtectedRoute><FormElements /></ProtectedRoute>} />
        <Route path="/basic-tables" element={<ProtectedRoute><BasicTables /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
        <Route path="/avatars" element={<ProtectedRoute><Avatars /></ProtectedRoute>} />
        <Route path="/badges" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
        <Route path="/buttons" element={<ProtectedRoute><Buttons /></ProtectedRoute>} />
        <Route path="/images" element={<ProtectedRoute><Images /></ProtectedRoute>} />
        <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
        <Route path="/line-chart" element={<ProtectedRoute><LineChart /></ProtectedRoute>} />
        <Route path="/bar-chart" element={<ProtectedRoute><BarChart /></ProtectedRoute>} />

      </Route>

      {/* UNAUTHORIZED */}
      <Route
        path="/unauthorized"
        element={
          <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-red-600">
            Akses Ditolak - Role Tidak Diizinkan
          </div>
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}