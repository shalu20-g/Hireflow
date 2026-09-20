import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/useAuth';

function friendlyError(err) {
  const message = err?.response?.data?.message;
  if (message) return message;
  if (err?.request) return 'Cannot reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}

function show(value) {
  return value === null || value === undefined || value === '' ? '—' : String(value);
}

// Candidate's own record from GET /api/candidates/me (identity resolved
// server-side from the JWT). Read-only display; no edits here.
export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', resume_link: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/api/candidates/me');
      setProfile(res.data?.candidate || null);
    } catch (err) {
      setProfile(null);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // Initial load awaits the network first (no synchronous setState in effect).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get('/api/candidates/me');
        if (!cancelled) {
          setProfile(res.data?.candidate || null);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setProfile(null);
          setError(friendlyError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) {
    return (
      <section aria-label="Profile">
        <h2>Profile</h2>
        <p role="alert">No profile information available. Please log in again.</p>
      </section>
    );
  }

  function startEdit() {
    setEditForm({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      resume_link: profile?.resume_link || '',
    });
    setFormError('');
    setNotice('');
    setEditing(true);
  }

  function onEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSave(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError('');
    setNotice('');
    try {
      // Only the three editable fields are ever sent; ids/email/role stay server-side.
      const res = await axiosInstance.patch('/api/candidates/me', {
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim(),
        resume_link: editForm.resume_link.trim(),
      });
      setProfile(res.data?.candidate || null);
      setEditing(false);
      setNotice('Profile updated successfully.');
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-label="Profile">
      <h2>Profile</h2>
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <p aria-busy="true">Loading profile…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={fetchProfile}>
            Retry
          </button>
        </div>
      ) : !profile ? (
        <p>No profile information available.</p>
      ) : editing ? (
        <form onSubmit={onSave} aria-label="Edit profile">
          <label>
            Full name
            <input name="full_name" value={editForm.full_name} onChange={onEditChange} required />
          </label>
          <label>
            Phone
            <input name="phone" value={editForm.phone} onChange={onEditChange} />
          </label>
          <label>
            Resume link
            <input name="resume_link" value={editForm.resume_link} onChange={onEditChange} />
          </label>
          {formError && <p role="alert">{formError}</p>}
          <button type="submit" className="button-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>{' '}
          <button type="button" onClick={() => setEditing(false)} disabled={saving}>
            Cancel
          </button>
        </form>
      ) : (
        <>
          <dl>
            <dt>User ID</dt>
            <dd>{user.id}</dd>
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Role</dt>
            <dd>{user.role}</dd>
            <dt>Full name</dt>
            <dd>{show(profile.full_name)}</dd>
            <dt>Phone</dt>
            <dd>{show(profile.phone)}</dd>
            <dt>Resume</dt>
            <dd>{show(profile.resume_link)}</dd>
          </dl>
          <button type="button" onClick={startEdit}>
            Edit
          </button>
        </>
      )}
    </section>
  );
}
