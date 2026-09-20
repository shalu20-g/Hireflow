import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import CandidateLayout from './pages/candidate/CandidateLayout';
import JobBrowse from './pages/candidate/JobBrowse';
import MyApplications from './pages/candidate/MyApplications';
import Profile from './pages/candidate/Profile';
import RecruiterLayout from './pages/recruiter/RecruiterLayout';
import MyJobs from './pages/recruiter/MyJobs';
import JobApplicants from './pages/recruiter/JobApplicants';
import AdminLayout from './pages/admin/AdminLayout';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStats from './pages/admin/AdminStats';

function HomeRedirect() {
  const { user, token } = useAuth();
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
        <Route path="/candidate" element={<CandidateLayout />}>
          <Route index element={<JobBrowse />} />
          <Route path="jobs" element={<JobBrowse />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
        <Route path="/recruiter" element={<RecruiterLayout />}>
          <Route index element={<MyJobs />} />
          <Route path="jobs" element={<MyJobs />} />
          <Route path="jobs/:jobId/applicants" element={<JobApplicants />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminUsers />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="stats" element={<AdminStats />} />
        </Route>
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
