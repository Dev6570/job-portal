import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathForRole } from "../auth/roles.js";
import Spinner from "./Spinner.jsx";

// Wrap a page: <ProtectedRoute allowedRoles={["admin"]}>...</ProtectedRoute>
// This is a UX guard only. The backend's require_role() is what really enforces access.
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="mb-2 text-xl font-semibold">Access denied</h1>
        <p className="mb-4 text-sm text-slate-600">Your account does not have permission to view this page.</p>
        <Link className="text-indigo-600 underline" to={homePathForRole(user.role)}>
          Go to my home page
        </Link>
      </div>
    );
  }

  return children;
}
