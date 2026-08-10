/** Per-run average / high-count / total over non-candidate points. */
export function buildEvalSummary(metrics, points) {
  const out = {}
  const pts0 = points || []
  ;(metrics || []).forEach((m) => {
    const pts = pts0.filter((p) => p.method === m.method && p.run_id === m.run_id && !p.is_candidate)
    const avg = pts.length ? pts.reduce((s, p) => s + Number(p.candidate_cosine || 0), 0) / pts.length : 0
    const high = pts.filter((p) => Number(p.candidate_cosine || 0) >= 0.6).length
    out[m.run_id] = { avg, high, total: pts.length }
  })
  return out
}

/** Most recent run_id per method, by created_at desc. */
export function latestRunIdByMethod(metrics) {
  const seen = {}
  ;[...(metrics || [])]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .forEach((m) => {
      if (!(m.method in seen)) seen[m.method] = m.run_id
    })
  return seen
}
