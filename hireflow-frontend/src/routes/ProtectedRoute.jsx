import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, token, loading } = useAuth();

  // Wait for session restoration so a stored session is never bounced to /login.
  if (loading) {
    return <p>Loading…</p>;
  }
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}
