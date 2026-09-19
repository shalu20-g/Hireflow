const STATUS_STYLES = {
  APPLIED: 'status-applied',
  SHORTLISTED: 'status-shortlisted',
  INTERVIEW: 'status-interview',
  SELECTED: 'status-selected',
  REJECTED: 'status-rejected',
  HIRED: 'status-hired',
};

// Single source of status colors. Unknown statuses render neutrally, never crash.
export default function StatusBadge({ status }) {
  const className = STATUS_STYLES[status] || 'status-unknown';
  return (
    <span className={`status-badge ${className}`} title={`Status: ${status}`}>
      {status}
    </span>
  );
}
