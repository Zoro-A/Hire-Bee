export function MiniBarChart({ items, valueKey, labelKey, color = "var(--color-accent)", max = 1 }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-sm text-ink-muted dark:text-ink-dark-muted">No chart data yet.</p>
  }
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const v = Number(item[valueKey] ?? 0)
        const pct = Math.max(0, Math.min(100, (v / max) * 100))
        return (
          <div key={String(item[labelKey])}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="truncate pr-2 text-ink dark:text-ink-dark">{item[labelKey]}</span>
              <span className="text-ink-muted dark:text-ink-dark-muted">{v.toFixed(3)}</span>
            </div>
            <div className="h-2 rounded bg-surface-subtle dark:bg-surface-dark-subtle">
              <div className="h-2 rounded" style={{ width: `${pct}%`, background: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
