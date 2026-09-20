import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

function friendlyError(err) {
  const message = err?.response?.data?.message;
  if (message) return message;
  if (err?.request) return 'Cannot reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}

// Mirrors the backend Phase 6 transition map exactly (see applicationService).
// Only these next states are ever offered; terminal states offer nothing.
const NEXT_STATUSES = {
  APPLIED: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['SELECTED', 'REJECTED'],
  SELECTED: ['HIRED', 'REJECTED'],
  REJECTED: [],
  HIRED: [],
};

export default function JobApplicants() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [rowError, setRowError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get(`/api/jobs/${jobId}/applicants`);
      setJob(res.data?.job || null);
      setApplicants(res.data?.applicants || []);
    } catch (err) {
      setJob(null);
      setApplicants(null);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Initial load awaits the network first (no synchronous setState in effect).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/api/jobs/${jobId}/applicants`);
        if (!cancelled) {
          setJob(res.data?.job || null);
          setApplicants(res.data?.applicants || []);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setJob(null);
          setApplicants(null);
          setError(friendlyError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  async function onAdvance(application, nextStatus) {
    if (updatingId) return;
    setUpdatingId(application.id);
    setRowError('');
    setNotice('');
    try {
      await axiosInstance.patch(`/api/applications/${application.id}/status`, { status: nextStatus });
      setNotice(`Moved to ${nextStatus}.`);
      fetchApplicants();
    } catch (err) {
      // Backend stays authoritative (e.g. state changed concurrently).
      setRowError(friendlyError(err));
      fetchApplicants();
    } finally {
      setUpdatingId(null);
    }
  }

  const columns = [
    { key: 'name', label: 'Candidate', render: (row) => row.candidate.full_name },
    { key: 'email', label: 'Email', render: (row) => row.candidate.email },
    { key: 'phone', label: 'Phone', render: (row) => row.candidate.phone || '—' },
    {
      key: 'applied',
      label: 'Applied date',
      render: (row) => {
        const d = new Date(row.applied_at);
        return Number.isNaN(d.getTime())
          ? String(row.applied_at)
          : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      },
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      label: 'Advance',
      render: (row) => {
        const next = NEXT_STATUSES[row.status] || [];
        if (next.length === 0) return <span>—</span>;
        return (
          <>
            {next.map((s) => (
              <span key={s}>
                <button
                  type="button"
                  className={s === 'REJECTED' ? 'button-danger' : 'button-primary'}
                  onClick={() => onAdvance(row, s)}
                  disabled={updatingId === row.id}
                  title={`Move to ${s}`}
                >
                  {updatingId === row.id ? 'Saving…' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>{' '}
              </span>
            ))}
          </>
        );
      },
    },
  ];

  return (
    <section aria-label="Job applicants">
      <p>
        <Link to="/recruiter/jobs">← Back to My Jobs</Link>
      </p>
      <h2>Applicants{job ? `: ${job.title}` : ''}</h2>
      {notice && <p role="status">{notice}</p>}
      {rowError && <p role="alert">{rowError}</p>}
      {loading ? (
        <p aria-busy="true">Loading applicants…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={fetchApplicants}>
            Retry
          </button>
        </div>
      ) : applicants.length === 0 ? (
        <p>No applicants yet.</p>
      ) : (
        <DataTable columns={columns} rows={applicants} rowKey={(row) => row.id} />
      )}
    </section>
  );
}
