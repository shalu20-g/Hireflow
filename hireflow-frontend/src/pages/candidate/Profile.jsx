import { useAuth } from '../../context/useAuth';

// No dedicated candidate-profile endpoint exists in the backend, so this page
// renders only the authenticated identity already in AuthContext (id/email/role).
// Candidate-specific fields stored in the `candidates` table (full_name, phone,
// resume_link) are NOT exposed by any backend endpoint and therefore cannot be
// displayed here. See the Phase 10 report for details.
export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <section aria-label="Profile">
        <h2>Profile</h2>
        <p role="alert">No profile information available. Please log in again.</p>
      </section>
    );
  }

  return (
    <section aria-label="Profile">
      <h2>Profile</h2>
      <dl>
        <dt>User ID</dt>
        <dd>{user.id}</dd>
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Role</dt>
        <dd>{user.role}</dd>
      </dl>
      <p className="fine-print">
        Full name, phone, and resume details are not shown because the backend does not currently expose the
        candidate record for the logged-in user.
      </p>
    </section>
  );
}
