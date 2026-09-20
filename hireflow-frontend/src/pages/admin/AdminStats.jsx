import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

function friendlyError(err) {
  const message = err?.response?.data?.message;
  if (message) return message;
  if (err?.request) return 'Cannot reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}

function StatCard({ label, value }) {
  return (
    <div className="job-card">
      <h3>{label}</h3>
      <p className="stat-value">{value}</p>
    </div>
  );
}

export default function AdminStats() {
  const [stats, setStats] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/api/admin/stats');
      setStats(res.data?.stats || null);
    } catch (err) {
      setStats(null);
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
        const res = await axiosInstance.get('/api/admin/stats');
        if (!cancelled) {
          setStats(res.data?.stats || null);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setStats(null);
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

  const open = stats?.jobs_by_status?.open ?? 0;
  const closed = stats?.jobs_by_status?.closed ?? 0;
  const totalJobs = open + closed;

  return (
    <section aria-label="Admin stats">
      <h2>Stats</h2>
      {loading ? (
        <p aria-busy="true">Loading stats…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={fetchStats}>
            Retry
          </button>
        </div>
      ) : !stats ? (
        <p>No stats available.</p>
      ) : (
        <>
          <div className="job-list">
            <StatCard label="Total users" value={stats.total_users} />
            <StatCard label="Total jobs" value={stats.total_jobs} />
            <StatCard label="Total applications" value={stats.total_applications} />
            <StatCard label="Open jobs" value={open} />
            <StatCard label="Closed jobs" value={closed} />
          </div>
          <p className="fine-print" aria-label="Open versus closed summary">
            Open {open} of {totalJobs} jobs ({totalJobs === 0 ? '—' : `${Math.round((open / totalJobs) * 100)}% open`}).
          </p>
        </>
      )}
    </section>
  );
}
