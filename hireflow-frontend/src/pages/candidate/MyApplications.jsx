import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

function friendlyError(err) {
  const message = err?.response?.data?.message;
  if (message) return message;
  if (err?.request) return 'Cannot reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const COLUMNS = [
  { key: 'title', label: 'Job title', render: (row) => row.job.title },
  // Company name comes from the backend's nested application.job.company object.
  { key: 'company', label: 'Company', render: (row) => row.job.company?.name || '—' },
  { key: 'applied', label: 'Applied date', render: (row) => formatDate(row.applied_at) },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
];

export default function MyApplications() {
  const [applications, setApplications] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMine = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/api/applications/mine');
      setApplications(res.data?.applications || []);
    } catch (err) {
      setApplications(null);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load mirrors fetchMine below, but awaits the network first and
  // guards unmounted updates. fetchMine stays for the user-triggered Retry.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get('/api/applications/mine');
        if (!cancelled) {
          setApplications(res.data?.applications || []);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setApplications(null);
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

  return (
    <section aria-label="My applications">
      <h2>My Applications</h2>
      {loading ? (
        <p aria-busy="true">Loading your applications…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={fetchMine}>
            Retry
          </button>
        </div>
      ) : applications.length === 0 ? (
        <p>You haven&apos;t applied to anything yet.</p>
      ) : (
        <DataTable columns={COLUMNS} rows={applications} rowKey={(row) => row.id} />
      )}
    </section>
  );
}
