export function StatusBadge({ status }) {
  const styles = {
    applied:     "bg-warn-bg    text-warn",
    shortlisted: "bg-brand-soft text-brand-on-soft",
    interview:   "bg-success-bg  text-success",
    hired:       "bg-success-bg  text-success",
    rejected:    "bg-danger-bg   text-danger",
  }
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize tracking-wide ${styles[status] || "bg-surface-subtle text-ink-muted dark:bg-surface-dark-subtle dark:text-ink-dark-muted"}`}>
      {status}
    </span>
  )
}
