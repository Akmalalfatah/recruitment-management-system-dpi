import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { canAccess } from "../../lib/navConfig";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-panel">
        <div className="text-ink-500 text-sm">Memuat...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!canAccess(user.role, location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
