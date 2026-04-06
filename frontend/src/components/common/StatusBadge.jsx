export default function StatusBadge({ status }) {
  if (status === 'present') return <span className="badge-present">● Present</span>;
  if (status === 'late')    return <span className="badge-late">● Late</span>;
  return <span className="badge-absent">● Absent</span>;
}
