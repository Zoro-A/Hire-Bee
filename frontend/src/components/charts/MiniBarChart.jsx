import { ChartTableFallback } from "./ChartTableFallback.jsx"

// Single-series magnitude chart: color is structurally fixed to a strong
// step of the sequential ramp, not caller-configurable. The brand accent
// (--color-brand) is reserved for CTAs/identity and must never be reused as
// a data color (dataviz skill).
const BAR_COLOR = "var(--color-chart-seq-4)"

// With only one series, a <ChartLegend/> would just repeat the row labels
// already printed next to each bar — legends earn their place once a chart
// carries 2+ series (dataviz skill, "legend" step). Not rendered here on
// purpose; see ChartLegend.jsx for the multi-series version.

/**
 * Horizontal bar chart for a small set of named magnitudes compared against
 * a common `max`. Each bar is an inline SVG (rounded data-ends via `rx`, a
 * 50%-of-max guide line, and a native <title> tooltip) so no JS tooltip
 * library is needed. A `<ChartTableFallback>` underneath gives a complete,
 * non-visual alternative with the raw values.
 */
export function MiniBarChart({ items, valueKey, labelKey, max = 1, unit = "%", caption = "Chart values" }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-sm text-ink-muted dark:text-ink-dark-muted">No chart data yet.</p>
  }

  const rows = items.map((item) => {
    const raw = Number(item[valueKey] ?? 0)
    const pct = Math.max(0, Math.min(100, (raw / max) * 100))
    return { label: String(item[labelKey]), raw, pct }
  })

  return (
    <figure className="space-y-2">
      <figcaption className="sr-only">{caption}</figcaption>

      <div className="space-y-2">
        {rows.map((row) => {
          const displayPct = row.pct.toFixed(0)
          return (
            <div
              key={row.label}
              className="-mx-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle"
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-ink dark:text-ink-dark">{row.label}</span>
                <span className="tabular shrink-0 text-ink-muted dark:text-ink-dark-muted">
                  {displayPct}
                  {unit}
                </span>
              </div>
              <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-2 w-full" role="img">
                <title>
                  {row.label}: {displayPct}
                  {unit} (raw {row.raw.toFixed(3)})
                </title>
                <rect
                  x="0"
                  y="0"
                  width="100"
                  height="8"
                  rx="4"
                  className="fill-surface-subtle dark:fill-surface-dark-subtle"
                />
                <rect x="0" y="0" width={row.pct} height="8" rx="4" fill={BAR_COLOR} />
                {/* 50%-of-max guide line, drawn last so it stays visible over the fill */}
                <line
                  x1="50"
                  y1="0"
                  x2="50"
                  y2="8"
                  stroke="var(--color-ink)"
                  strokeOpacity="0.35"
                  strokeWidth="0.75"
                />
              </svg>
            </div>
          )
        })}
      </div>

      <div
        className="flex items-center justify-between text-[10px] text-ink-muted dark:text-ink-dark-muted"
        aria-hidden="true"
      >
        <span>0{unit}</span>
        <span>50{unit}</span>
        <span>max (100{unit})</span>
      </div>

      <ChartTableFallback
        caption={caption}
        columns={[
          { key: "label", header: "Label" },
          { key: "raw", header: "Raw value" },
          { key: "pct", header: "Percentage", align: "right" },
        ]}
        rows={rows.map((row) => ({
          key: row.label,
          label: row.label,
          raw: row.raw.toFixed(3),
          pct: `${row.pct.toFixed(1)}${unit}`,
        }))}
      />
    </figure>
  )
}
