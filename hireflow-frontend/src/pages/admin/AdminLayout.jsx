import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="dash-layout">
      <header className="dash-header">
        <h1>Admin Dashboard</h1>
        <div className="dash-account">
          <p className="dash-user">{user?.email}</p>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <nav aria-label="Admin navigation" className="dash-nav">
        <NavLink to="/admin/users">Users</NavLink>
        <NavLink to="/admin/stats">Stats</NavLink>
      </nav>
      <main className="dash-main">
        <Outlet />
      </main>
    </div>
  );
}
