import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function RecruiterLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="dash-layout">
      <header className="dash-header">
        <h1>Recruiter Dashboard</h1>
        <p className="dash-user">{user?.email}</p>
      </header>
      <nav aria-label="Recruiter navigation" className="dash-nav">
        <Link to="/recruiter/jobs">My Jobs</Link>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </nav>
      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}
