import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import JobCard from '../../components/JobCard';

function friendlyError(err) {
  const message = err?.response?.data?.message;
  if (message) return message;
  if (err?.request) return 'Cannot reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}

export default function JobBrowse() {
  const [filters, setFilters] = useState({ title: '', location: '', job_type: '' });
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');
  const [appliedIds, setAppliedIds] = useState(null); // null = unknown (not yet loaded / failed)
  const [appsError, setAppsError] = useState('');
  const [applyingIds, setApplyingIds] = useState([]);
  const [notice, setNotice] = useState('');

  const fetchJobs = useCallback(async (params) => {
    setJobsLoading(true);
    setJobsError('');
    try {
      // Re-query the backend on every filter action; never filter client-side only.
      const active = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== ''),
      );
      const res = await axiosInstance.get('/api/jobs', { params: active });
      setJobs(res.data?.jobs || []);
    } catch (err) {
      setJobsError(friendlyError(err));
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const fetchApplied = useCallback(async () => {
    setAppsError('');
    try {
      const res = await axiosInstance.get('/api/applications/mine');
      const ids = new Set((res.data?.applications || []).map((a) => a.job.id));
      setAppliedIds(ids);
    } catch (err) {
      // Do not pretend the user never applied: keep set unknown, disable Apply.
      setAppliedIds(null);
      setAppsError(friendlyError(err));
    }
  }, []);

  // Initial load mirrors fetchJobs/fetchApplied below, but awaits the network
  // first and guards unmounted updates. The callbacks stay for user actions
  // (filter, clear, retry, post-apply refresh).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get('/api/jobs', { params: {} });
        if (!cancelled) {
          setJobs(res.data?.jobs || []);
          setJobsError('');
        }
      } catch (err) {
        if (!cancelled) setJobsError(friendlyError(err));
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
      try {
        const res = await axiosInstance.get('/api/applications/mine');
        if (!cancelled) {
          setAppliedIds(new Set((res.data?.applications || []).map((a) => a.job.id)));
          setAppsError('');
        }
      } catch (err) {
        if (!cancelled) {
          setAppliedIds(null);
          setAppsError(friendlyError(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function onFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function onApplyFilters(e) {
    e.preventDefault();
    fetchJobs(filters);
  }

  function onClearFilters() {
    const cleared = { title: '', location: '', job_type: '' };
    setFilters(cleared);
    fetchJobs(cleared);
  }

  async function onApply(job) {
    if (applyingIds.includes(job.id)) return;
    setNotice('');
    setApplyingIds((prev) => [...prev, job.id]);
    try {
      await axiosInstance.post('/api/applications', { job_id: job.id });
      // Source of truth stays the backend; update local set immediately, no reload.
      setAppliedIds((prev) => new Set([...(prev || []), job.id]));
      setNotice(`Successfully applied to "${job.title}".`);
    } catch (err) {
      setNotice(friendlyError(err));
      // Refresh the set in case the failure was a duplicate the UI missed.
      fetchApplied();
    } finally {
      setApplyingIds((prev) => prev.filter((id) => id !== job.id));
    }
  }

  const appliedUnknown = appliedIds === null;

  return (
    <section aria-label="Browse jobs">
      <h2>Browse Jobs</h2>

      <form className="filter-bar" onSubmit={onApplyFilters}>
        <label>
          Title
          <input name="title" value={filters.title} onChange={onFilterChange} placeholder="e.g. Developer" />
        </label>
        <label>
          Location
          <input name="location" value={filters.location} onChange={onFilterChange} placeholder="e.g. Remote" />
        </label>
        <label>
          Job type
          <input name="job_type" value={filters.job_type} onChange={onFilterChange} placeholder="e.g. Full-time" />
        </label>
        <button type="submit" disabled={jobsLoading}>
          {jobsLoading ? 'Filtering…' : 'Apply filters'}
        </button>
        <button type="button" onClick={onClearFilters} disabled={jobsLoading}>
          Clear filters
        </button>
      </form>

      {notice && <p role="status">{notice}</p>}

      {appsError && (
        <p role="alert">
          Could not load your applications ({appsError}). Apply buttons are disabled to avoid duplicates.{' '}
          <button type="button" onClick={fetchApplied}>
            Retry
          </button>
        </p>
      )}

      {jobsLoading ? (
        <p aria-busy="true">Loading jobs…</p>
      ) : jobsError ? (
        <div role="alert">
          <p>{jobsError}</p>
          <button type="button" onClick={() => fetchJobs(filters)}>
            Retry
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <p>No jobs found</p>
      ) : (
        <div className="job-list">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              applied={appliedIds?.has(job.id)}
              applying={applyingIds.includes(job.id)}
              applyDisabled={appliedUnknown || !!appsError}
              onApply={onApply}
            />
          ))}
        </div>
      )}
    </section>
  );
}
