import { Link, Outlet, useNavigate } from 'react-router-dom';
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
        <p className="dash-user">{user?.email}</p>
      </header>
      <nav aria-label="Candidate navigation" className="dash-nav">
        <Link to="/candidate/jobs">Jobs</Link>
        <Link to="/candidate/applications">My Applications</Link>
        <Link to="/candidate/profile">Profile</Link>
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
