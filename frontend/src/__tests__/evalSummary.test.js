import { describe, it, expect } from "vitest"

// Mirrors the evalSummaryByRun memo from JobSeekerDashboard.jsx.
function buildEvalSummary(metrics, points) {
  const out = {}
  ;(metrics || []).forEach((m) => {
    const pts = (points || []).filter((p) => p.method === m.method && p.run_id === m.run_id && !p.is_candidate)
    const avg = pts.length ? pts.reduce((s, p) => s + Number(p.candidate_cosine || 0), 0) / pts.length : 0
    const high = pts.filter((p) => Number(p.candidate_cosine || 0) >= 0.6).length
    out[m.run_id] = { avg, high, total: pts.length }
  })
  return out
}

describe("evalSummaryByRun (issue #74)", () => {
  const metrics = [
    { run_id: 1, method: "cosine_similarity" },
    { run_id: 2, method: "cosine_similarity" },
  ]
  const points = [
    { run_id: 1, method: "cosine_similarity", candidate_cosine: 0.8, is_candidate: false },
    { run_id: 1, method: "cosine_similarity", candidate_cosine: 0.4, is_candidate: false },
    { run_id: 2, method: "cosine_similarity", candidate_cosine: 0.1, is_candidate: false },
  ]

  it("does not bleed points across runs sharing the same method", () => {
    const s = buildEvalSummary(metrics, points)
    expect(s[1].total).toBe(2)
    expect(s[1].avg).toBeCloseTo(0.6, 5)
    expect(s[2].total).toBe(1)
    expect(s[2].avg).toBeCloseTo(0.1, 5)
  })

  it("excludes candidate points", () => {
    const pts = [
      ...points,
      { run_id: 1, method: "cosine_similarity", candidate_cosine: 1.0, is_candidate: true },
    ]
    const s = buildEvalSummary(metrics, pts)
    expect(s[1].total).toBe(2)
  })

  it("returns zero stats when no points match", () => {
    const s = buildEvalSummary([{ run_id: 99, method: "x" }], points)
    expect(s[99]).toEqual({ avg: 0, high: 0, total: 0 })
  })
})
