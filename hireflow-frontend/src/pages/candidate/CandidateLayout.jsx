import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function CandidateLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="dash-layout">
      <header className="dash-header">
        <h1>Candidate Dashboard</h1>
        <div className="dash-account">
          <p className="dash-user">{user?.email}</p>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <nav aria-label="Candidate navigation" className="dash-nav">
        <NavLink to="/candidate/jobs">Jobs</NavLink>
        <NavLink to="/candidate/applications">My Applications</NavLink>
        <NavLink to="/candidate/profile">Profile</NavLink>
      </nav>
      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}
