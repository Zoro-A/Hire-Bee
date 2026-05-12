export function MiniBarChart({ items, valueKey, labelKey, color = "#2563eb", max = 1 }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-sm text-[#65709a]">No chart data yet.</p>
  }
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const v = Number(item[valueKey] ?? 0)
        const pct = Math.max(0, Math.min(100, (v / max) * 100))
        return (
          <div key={String(item[labelKey])}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="truncate pr-2">{item[labelKey]}</span>
              <span>{v.toFixed(3)}</span>
            </div>
            <div className="h-2 rounded bg-[#e8ecfb] dark:bg-[#1c2747]">
              <div className="h-2 rounded" style={{ width: `${pct}%`, background: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
