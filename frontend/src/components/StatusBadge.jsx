/**
 * StatusBadge.jsx
 *
 * A small visual indicator for workshop status.
 * The pending badge has an animated dot — it signals that action is
 * awaited without being alarming (amber, not red).
 */
export default function StatusBadge({ status }) {
  if (status === 1 || status === 'Accepted' || status === 'accepted') {
    return <span className="badge badge-success">Accepted</span>;
  }
  if (status === 0 || status === 'Pending' || status === 'pending') {
    return (
      <span className="badge badge-pending">
        <span className="pulse-dot" aria-hidden="true" />
        Pending
      </span>
    );
  }
  return <span className="badge badge-danger">{status || 'Unknown'}</span>;
}
