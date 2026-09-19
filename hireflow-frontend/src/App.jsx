import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import { AdminDashboard, CandidateDashboard, RecruiterDashboard } from './pages/Dashboards';

function HomeRedirect() {
  const { user, token, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role === 'recruiter') return <Navigate to="/recruiter" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/candidate" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<ProtectedRoute allowedRoles={['candidate']} />}>
        <Route path="/candidate/*" element={<CandidateDashboard />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
        <Route path="/recruiter/*" element={<RecruiterDashboard />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
