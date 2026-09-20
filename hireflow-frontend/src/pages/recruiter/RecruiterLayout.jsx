import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
        <div className="dash-account">
          <p className="dash-user">{user?.email}</p>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <nav aria-label="Recruiter navigation" className="dash-nav">
        <NavLink to="/recruiter/jobs">My Jobs</NavLink>
      </nav>
      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}
