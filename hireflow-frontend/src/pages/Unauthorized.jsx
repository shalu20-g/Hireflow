import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const HOME_BY_ROLE = { candidate: '/candidate', recruiter: '/recruiter', admin: '/admin' };

export default function Unauthorized() {
  const { role } = useAuth();
  const home = HOME_BY_ROLE[role] || '/login';

  return (
    <main>
      <h1>Not authorized</h1>
      <p>You do not have permission to access this area.</p>
      <p>
        <Link to={home}>{role ? 'Back to your dashboard' : 'Go to login'}</Link>
      </p>
    </main>
  );
}
