/**
 * Legend for multi-series charts. Per the dataviz procedure, a legend is
 * only justified once a chart carries 2+ series — a single-series chart's
 * meaning is already given by its axis/label, and a legend there is just
 * noise. `MiniBarChart` is single-series today, so it does not render this;
 * it exists here for the next chart (or a future multi-metric MiniBarChart)
 * that actually needs it.
 *
 * `items`: [{ key, label, color }] — `color` is a CSS color value, normally
 * one of the `--color-chart-*` tokens (never the brand accent).
 */
export function ChartLegend({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted" role="list">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: item.color }}
          />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  )
}
