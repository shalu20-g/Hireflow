import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import DataTable from '../../components/DataTable';

function friendlyError(err) {
  const message = err?.response?.data?.message;
  if (message) return message;
  if (err?.request) return 'Cannot reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
}

const EMPTY_FORM = { title: '', description: '', location: '', job_type: '' };

export default function MyJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [formNotice, setFormNotice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [savingId, setSavingId] = useState(null);
  const [rowError, setRowError] = useState('');
  const [closingId, setClosingId] = useState(null);
  const [companies, setCompanies] = useState(null); // null = not loaded yet
  const [coForm, setCoForm] = useState({ name: '', description: '' });
  const [creatingCo, setCreatingCo] = useState(false);
  const [coError, setCoError] = useState('');
  const [coNotice, setCoNotice] = useState('');
  const [jobCompanyId, setJobCompanyId] = useState('');

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/companies/mine');
      setCompanies(res.data?.companies || []);
    } catch {
      setCompanies(null);
    }
  }, []);

  const fetchMine = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/api/jobs/mine');
      setJobs(res.data?.jobs || []);
    } catch (err) {
      setJobs(null);
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
        const res = await axiosInstance.get('/api/jobs/mine');
        if (!cancelled) {
          setJobs(res.data?.jobs || []);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setJobs(null);
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

  // Owned companies for the create-company section (same await-first pattern).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get('/api/companies/mine');
        if (!cancelled) setCompanies(res.data?.companies || []);
      } catch {
        if (!cancelled) setCompanies(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function onFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onCreate(e) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    setFormError('');
    setFormNotice('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        job_type: form.job_type.trim(),
      };
      // Only sent when the recruiter owns several companies; otherwise the
      // backend resolves the single owned company and ownership stays server-side.
      if (companies && companies.length > 1 && jobCompanyId) {
        payload.company_id = Number(jobCompanyId);
      }
      const res = await axiosInstance.post('/api/jobs', payload);
      setForm(EMPTY_FORM);
      setJobCompanyId('');
      setFormNotice(`Job "${res.data?.job?.title || form.title}" created successfully.`);
      fetchMine();
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setCreating(false);
    }
  }

  function onCoFormChange(e) {
    const { name, value } = e.target;
    setCoForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onCreateCompany(e) {
    e.preventDefault();
    if (creatingCo) return;
    setCreatingCo(true);
    setCoError('');
    setCoNotice('');
    try {
      const res = await axiosInstance.post('/api/companies', {
        name: coForm.name.trim(),
        description: coForm.description.trim(),
      });
      setCoForm({ name: '', description: '' });
      setCoNotice(`Company "${res.data?.company?.name || coForm.name}" created successfully.`);
      fetchCompanies();
    } catch (err) {
      setCoError(friendlyError(err));
    } finally {
      setCreatingCo(false);
    }
  }

  function startEdit(job) {
    setEditingId(job.id);
    setEditForm({ title: job.title, description: job.description || '', location: job.location, job_type: job.job_type });
    setRowError('');
  }

  function onEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSaveEdit(job) {
    if (savingId) return;
    setSavingId(job.id);
    setRowError('');
    try {
      await axiosInstance.put(`/api/jobs/${job.id}`, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        location: editForm.location.trim(),
        job_type: editForm.job_type.trim(),
      });
      setEditingId(null);
      fetchMine();
    } catch (err) {
      setRowError(friendlyError(err));
    } finally {
      setSavingId(null);
    }
  }

  async function onClose(job) {
    if (closingId) return;
    setClosingId(job.id);
    setRowError('');
    try {
      await axiosInstance.patch(`/api/jobs/${job.id}/close`);
      fetchMine();
    } catch (err) {
      setRowError(friendlyError(err));
    } finally {
      setClosingId(null);
    }
  }

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'company', label: 'Company', render: (row) => row.company_name || `ID ${row.company_id}` },
    { key: 'location', label: 'Location' },
    { key: 'job_type', label: 'Type' },
    { key: 'status', label: 'Status' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) =>
        editingId === row.id ? (
          <>
            <button type="button" onClick={() => onSaveEdit(row)} disabled={savingId === row.id}>
              {savingId === row.id ? 'Saving…' : 'Save'}
            </button>{' '}
            <button type="button" onClick={() => setEditingId(null)} disabled={savingId === row.id}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => navigate(`/recruiter/jobs/${row.id}/applicants`)}>
              Applicants
            </button>{' '}
            <button type="button" onClick={() => startEdit(row)}>
              Edit
            </button>{' '}
            {row.status === 'open' && (
              <button type="button" onClick={() => onClose(row)} disabled={closingId === row.id}>
                {closingId === row.id ? 'Closing…' : 'Close'}
              </button>
            )}
          </>
        ),
    },
  ];

  return (
    <section aria-label="My jobs">
      <h2>My Jobs</h2>

      <h3>My Companies</h3>
      {companies !== null && companies.length > 0 && (
        <ul>
          {companies.map((c) => (
            <li key={c.id}>
              {c.name}
              {c.description ? ` — ${c.description}` : ''}
            </li>
          ))}
        </ul>
      )}
      <form className="filter-bar" onSubmit={onCreateCompany} aria-label="Create company">
        <label>
          Company name
          <input name="name" value={coForm.name} onChange={onCoFormChange} required />
        </label>
        <label>
          Description (optional)
          <input name="description" value={coForm.description} onChange={onCoFormChange} />
        </label>
        <button type="submit" disabled={creatingCo}>
          {creatingCo ? 'Creating…' : 'Create company'}
        </button>
      </form>
      {coError && <p role="alert">{coError}</p>}
      {coNotice && <p role="status">{coNotice}</p>}

      <form className="filter-bar" onSubmit={onCreate} aria-label="Create job">
        <label>
          Title
          <input name="title" value={form.title} onChange={onFormChange} required />
        </label>
        <label>
          Description
          <input name="description" value={form.description} onChange={onFormChange} required />
        </label>
        <label>
          Location
          <input name="location" value={form.location} onChange={onFormChange} required />
        </label>
        <label>
          Job type
          <input name="job_type" value={form.job_type} onChange={onFormChange} required />
        </label>
        {companies && companies.length > 1 && (
          <label>
            Company
            <select value={jobCompanyId} onChange={(e) => setJobCompanyId(e.target.value)} required>
              <option value="">Select a company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="submit" disabled={creating}>
          {creating ? 'Creating…' : 'Create job'}
        </button>
      </form>
      {formError && <p role="alert">{formError}</p>}
      {formNotice && <p role="status">{formNotice}</p>}

      {loading ? (
        <p aria-busy="true">Loading your jobs…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={fetchMine}>
            Retry
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <p>No jobs yet. Create your first job above.</p>
      ) : (
        <>
          {rowError && <p role="alert">{rowError}</p>}
          {editingId !== null && (
            <form className="filter-bar" aria-label="Edit job" onSubmit={(e) => e.preventDefault()}>
              <label>
                Title
                <input name="title" value={editForm.title} onChange={onEditChange} required />
              </label>
              <label>
                Description
                <input name="description" value={editForm.description} onChange={onEditChange} required />
              </label>
              <label>
                Location
                <input name="location" value={editForm.location} onChange={onEditChange} required />
              </label>
              <label>
                Job type
                <input name="job_type" value={editForm.job_type} onChange={onEditChange} required />
              </label>
            </form>
          )}
          <DataTable columns={columns} rows={jobs} rowKey={(row) => row.id} />
        </>
      )}
    </section>
  );
}
