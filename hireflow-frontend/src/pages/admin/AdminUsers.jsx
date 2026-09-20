import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import DataTable from '../../components/DataTable';

function friendlyError(err) {
  const message = err?.response?.data?.message;
  if (message) return message;
  if (err?.request) return 'Cannot reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}

export default function AdminUsers() {
  const [users, setUsers] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [rowError, setRowError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/api/admin/users');
      setUsers(res.data?.users || []);
    } catch (err) {
      setUsers(null);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load awaits the network first (no synchronous setState in effect).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get('/api/admin/users');
        if (!cancelled) {
          setUsers(res.data?.users || []);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setUsers(null);
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

  async function onDeactivate(user) {
    if (deactivatingId) return;
    setDeactivatingId(user.id);
    setRowError('');
    setNotice('');
    try {
      await axiosInstance.patch(`/api/admin/users/${user.id}/deactivate`);
      // Update only after the API confirms success.
      setUsers((prev) => (prev || []).map((u) => (u.id === user.id ? { ...u, is_active: false } : u)));
      setNotice(`Deactivated ${user.email}.`);
    } catch (err) {
      setRowError(friendlyError(err));
    } finally {
      setDeactivatingId(null);
    }
  }

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    {
      key: 'active',
      label: 'Active',
      render: (row) => (
        <span className={`status-badge ${row.is_active ? 'status-selected' : 'status-rejected'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row) =>
        row.is_active ? (
          <button
            type="button"
            onClick={() => onDeactivate(row)}
            disabled={deactivatingId === row.id}
            title={`Deactivate ${row.email}`}
          >
            {deactivatingId === row.id ? 'Deactivating…' : 'Deactivate'}
          </button>
        ) : (
          <span>Inactive</span>
        ),
    },
  ];

  return (
    <section aria-label="Admin users">
      <h2>Users</h2>
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <p aria-busy="true">Loading users…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={fetchUsers}>
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <>
          {rowError && <p role="alert">{rowError}</p>}
          <DataTable columns={columns} rows={users} rowKey={(row) => row.id} />
        </>
      )}
    </section>
  );
}
