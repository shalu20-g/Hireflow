export default function JobCard({ job, applied, applying, applyDisabled, onApply, applyLabel }) {
  const isApplied = !!applied;
  const busy = !!applying;

  return (
    <article className="job-card">
      <h3>{job.title}</h3>
      <p className="job-meta">
        <span>{job.location}</span>
        {' · '}
        <span>{job.job_type}</span>
        {job.status && (
          <>
            {' · '}
            <span className="job-status">{job.status}</span>
          </>
        )}
      </p>
      {/* Backend exposes company_id only (no company name on GET /api/jobs). */}
      <p className="job-company">Company ID: {job.company_id}</p>
      {job.description && <p className="job-desc">{job.description}</p>}
      {onApply && (
        <button
          type="button"
          onClick={() => onApply(job)}
          disabled={isApplied || busy || applyDisabled}
          title={isApplied ? 'You have already applied to this job' : `Apply to ${job.title}`}
        >
          {isApplied ? 'Applied' : busy ? 'Applying…' : applyLabel || 'Apply'}
        </button>
      )}
    </article>
  );
}
