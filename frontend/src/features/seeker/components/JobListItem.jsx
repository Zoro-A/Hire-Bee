import { formatJobMatchLabel } from "@/lib/matching.js"

export function JobListItem({ job, match, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl border p-4 text-left text-sm transition ${
        isSelected
          ? "border-brand bg-brand-soft/40 dark:bg-brand/10"
          : "border-surface-border hover:border-brand hover:bg-surface-subtle dark:border-surface-dark-border dark:hover:bg-surface-dark-subtle"
      }`}
    >
      <p className="text-lg font-semibold text-ink dark:text-ink-dark">{job.title}</p>
      <p className="text-xs text-ink-muted dark:text-ink-dark-muted">{job.location || "Remote"} • ${job.salary || "N/A"}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="rounded-full bg-success-bg px-2 py-1 text-xs font-semibold text-success">{formatJobMatchLabel(match)}</span>
        <span className="text-xs text-ink-muted dark:text-ink-dark-muted">Apply now</span>
      </div>
    </button>
  )
}
