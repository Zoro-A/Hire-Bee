/**
 * Centered placeholder for empty lists/panels — icon + title + optional
 * description and action, used wherever a dashboard has nothing to show yet.
 */
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-surface-border px-6 py-12 text-center">
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-surface-subtle text-2xl text-ink-faint">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="font-display text-base font-semibold text-ink">{title}</p>
        {description ? <p className="mx-auto max-w-sm text-sm text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
