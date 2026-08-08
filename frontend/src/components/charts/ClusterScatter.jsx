import { ChartLegend } from "./ChartLegend.jsx"
import { ChartTableFallback } from "./ChartTableFallback.jsx"

// Categorical data color (dataviz skill, "color by job" step): cluster_label
// is a category, not a magnitude, so it gets the categorical --chart-1..6
// ramp cycled by index. candidate_cosine is a magnitude and is already
// encoded by radius below — it must never also drive color (no
// double-encoding the same value).
const CLUSTER_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
]
const clusterColor = (label) => CLUSTER_COLORS[Math.abs(Number(label || 0)) % CLUSTER_COLORS.length]

// Geometry (issue #74 fix) — preserve exactly, do not "simplify":
// - seedAngle spreads points deterministically around the ring using the
//   golden-angle increment (137.508deg) keyed off a stable id, so the same
//   job always lands at the same angle across renders.
// - radius maps similarity to an ABSOLUTE scale (not relative to whatever
//   other points happen to be in the current view). Without this, a single
//   very-similar or very-dissimilar point would rescale every other point's
//   apparent distance from the centre — that rescaling was the bug in #74.
const seedAngle = (id) => ((Number(id) * 137.508) % 360) * (Math.PI / 180)
const simToRadius = (sim) => 42 * Math.pow(1 - sim, 0.72)

// Reference rings at these similarity levels, innermost (highest sim) first.
const REFERENCE_RINGS = [0.25, 0.5, 0.75]

// The candidate marker is the one sanctioned amber (--brand) moment in this
// chart, and the one hexagon — hex geometry here is functional (it marks
// "this point is different in kind, not just position"), matching the
// clip-path hexagon used by HexBadge/MatchScore, never decorative.
function hexPoints(cx, cy, halfWidth, halfHeight) {
  return [
    [cx - 0.5 * halfWidth, cy - halfHeight],
    [cx + 0.5 * halfWidth, cy - halfHeight],
    [cx + halfWidth, cy],
    [cx + 0.5 * halfWidth, cy + halfHeight],
    [cx - 0.5 * halfWidth, cy + halfHeight],
    [cx - halfWidth, cy],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(" ")
}

export function ClusterScatter({ points, method, runId }) {
  const all = Array.isArray(points) ? points : []
  const scoped = all.filter((p) => p.method === method && (runId == null || p.run_id === runId))

  if (scoped.length === 0) {
    return <p className="text-sm text-ink-muted dark:text-ink-dark-muted">No chart data yet.</p>
  }

  const distanceLabel = method === "cosine_similarity" ? "higher cosine = closer to centre" : "higher overlap = closer to centre"

  const plotted = scoped.map((p, i) => {
    const angle = seedAngle(p.job_id || i + 1)
    const sim = Math.max(0, Math.min(1, Number(p.candidate_cosine ?? 0)))
    const radius = p.is_candidate ? 0 : simToRadius(sim)
    return {
      ...p,
      key: `${p.job_id ?? "pt"}-${i}`,
      sim,
      radius,
      cx: 50 + radius * Math.cos(angle),
      cy: 50 + radius * Math.sin(angle),
    }
  })

  const jobs = plotted.filter((p) => !p.is_candidate)
  const candidates = plotted.filter((p) => p.is_candidate)

  const clusterLabels = [...new Set(jobs.map((p) => p.cluster_label))].sort((a, b) => Number(a) - Number(b))
  const legendItems = clusterLabels.map((label) => ({
    key: `cluster-${label}`,
    label: `Cluster ${label}`,
    color: clusterColor(label),
  }))
  if (candidates.length > 0) {
    legendItems.push({ key: "candidate", label: "Your skill vector", color: "var(--color-brand)" })
  }

  return (
    <figure className="space-y-2">
      <figcaption className="sr-only">
        Similarity scatter for {method === "cosine_similarity" ? "cosine similarity" : "embedding distance"}
      </figcaption>

      <div className="relative w-full overflow-hidden rounded-xl border border-surface-border bg-surface-raised dark:border-surface-dark-border dark:bg-surface-dark-raised">
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Job similarity scatter. Distance from the centre encodes similarity: ${distanceLabel}. Color encodes job cluster; the amber hexagon marks your skill vector.`}
          className="h-64 w-full"
        >
          {REFERENCE_RINGS.map((sim) => {
            const r = simToRadius(sim)
            return (
              <g key={sim}>
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  stroke="var(--color-ink)"
                  strokeOpacity="0.14"
                  strokeWidth="0.4"
                  strokeDasharray="1.4 1.4"
                />
                <text
                  x="50"
                  y={50 - r - 1.4}
                  textAnchor="middle"
                  fontSize="3.1"
                  fill="var(--color-ink-faint)"
                >
                  {Math.round(sim * 100)}%
                </text>
              </g>
            )
          })}

          {jobs.map((p) => (
            <circle
              key={p.key}
              data-point="job"
              data-radius={p.radius}
              cx={p.cx}
              cy={p.cy}
              r={1.8}
              fill={clusterColor(p.cluster_label)}
            >
              <title>
                {p.title ?? `Job ${p.job_id}`}: {Math.round(p.sim * 100)}% similarity (cluster {p.cluster_label})
              </title>
            </circle>
          ))}

          {candidates.map((p) => (
            <polygon
              key={p.key}
              data-point="candidate"
              data-radius={p.radius}
              points={hexPoints(p.cx, p.cy, 3.6, 2.9)}
              fill="var(--color-brand)"
            >
              <title>{p.title ?? "You"}: your skill vector</title>
            </polygon>
          ))}
        </svg>
      </div>

      <ChartLegend items={legendItems} />

      <ChartTableFallback
        caption={`Similarity scatter — ${scoped.length} scored ${scoped.length === 1 ? "job" : "jobs"} (${distanceLabel})`}
        columns={[
          { key: "title", header: "Job" },
          { key: "cluster", header: "Cluster" },
          { key: "similarity", header: "Similarity", align: "right" },
        ]}
        rows={scoped.map((p, i) => ({
          key: `${p.job_id ?? "pt"}-${i}`,
          title: p.is_candidate ? (p.title ?? "You") : (p.title ?? `Job ${p.job_id}`),
          cluster: p.is_candidate ? "—" : p.cluster_label,
          similarity: `${Math.round(Math.max(0, Math.min(1, Number(p.candidate_cosine ?? 0))) * 100)}%`,
        }))}
      />
    </figure>
  )
}
