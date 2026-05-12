export function ClusterScatter({ points, method, runId }) {
  const all = Array.isArray(points) ? points : []
  const scoped = all.filter((p) => p.method === method && (runId == null || p.run_id === runId))
  if (scoped.length === 0) return <p className="text-sm text-[#65709a]">No chart data yet.</p>
  const palette = ["#2563eb", "#7c3aed", "#0d9488", "#d97706", "#dc2626", "#0891b2"]
  const seedAngle = (id) => ((Number(id) * 137.508) % 360) * (Math.PI / 180)
  return (
    <div className="relative h-64 w-full rounded-xl border border-[#d8dcef] bg-[#fafcff] dark:border-[#2d355c] dark:bg-[#101933]">
      {scoped.map((p, i) => {
        const angle = seedAngle(p.job_id || i + 1)
        const sim = Math.max(0, Math.min(1, Number(p.candidate_cosine ?? 0)))
        const radius = p.is_candidate ? 0 : 42 * Math.pow(1 - sim, 0.72)
        const left = 50 + radius * Math.cos(angle)
        const top = 50 + radius * Math.sin(angle)
        const color = p.is_candidate ? "#22c55e" : palette[Math.abs(Number(p.cluster_label || 0)) % palette.length]
        const size = p.is_candidate ? 12 : 8
        return (
          <div
            key={`${p.job_id}-${i}`}
            title={p.title}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${left}%`, top: `${top}%`, width: `${size}px`, height: `${size}px`, background: color }}
          />
        )
      })}
      <div className="absolute bottom-2 right-2 text-[10px] text-[#65709a]">
        Green point = your skill vector ({method === "cosine_similarity" ? "higher cosine = closer" : "higher overlap = closer"})
      </div>
    </div>
  )
}
