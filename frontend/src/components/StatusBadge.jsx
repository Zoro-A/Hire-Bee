export function StatusBadge({ status }) {
  const styles = {
    applied: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    shortlisted: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    interview: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    hired: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    rejected: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  }
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${styles[status] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
      {status}
    </span>
  )
}
