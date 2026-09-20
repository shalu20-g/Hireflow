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
      {/* Company name comes from the backend's nested job.company object. */}
      <p className="job-company">{job.company?.name || `Company ID: ${job.company_id}`}</p>
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
