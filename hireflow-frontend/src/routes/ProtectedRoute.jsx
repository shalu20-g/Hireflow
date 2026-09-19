import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, token } = useAuth();

  // Auth state initializes synchronously from storage, so a stored session
  // is present on first render and never flashes through to /login.
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}
