import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { homePathForRole, ROLES } from "./auth/roles.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppShell from "./components/AppShell.jsx";
import Spinner from "./components/Spinner.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import RolePlaceholder from "./pages/RolePlaceholder.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Loading..." />;
  return <Navigate to={user ? homePathForRole(user.role) : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AppShell><AdminDashboard /></AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <AppShell><RolePlaceholder title="Student area" /></AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/company"
        element={
          <ProtectedRoute allowedRoles={[ROLES.COMPANY]}>
            <AppShell><RolePlaceholder title="Company area" /></AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
