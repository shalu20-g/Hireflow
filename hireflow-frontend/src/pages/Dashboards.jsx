import { useAuth } from '../context/AuthContext';

function Placeholder({ title, label }) {
  const { user, logout } = useAuth();

  return (
    <main>
      <h1>{title}</h1>
      <p data-testid="placeholder-label">{label}</p>
      <p>
        Signed in as {user?.email} ({user?.role})
      </p>
      <button type="button" onClick={logout}>
        Log out
      </button>
    </main>
  );
}

export function CandidateDashboard() {
  return <Placeholder title="Candidate Dashboard" label="Candidate placeholder is displayed." />;
}

export function RecruiterDashboard() {
  return <Placeholder title="Recruiter Dashboard" label="Recruiter placeholder is displayed." />;
}

export function AdminDashboard() {
  return <Placeholder title="Admin Dashboard" label="Admin placeholder is displayed." />;
}
