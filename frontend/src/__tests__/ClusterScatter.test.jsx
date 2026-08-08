import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { ClusterScatter } from "@/components/charts/ClusterScatter.jsx"

const points = [
  { run_id: 1, method: "cosine_similarity", job_id: 10, title: "A", cluster_label: 0, candidate_cosine: 0.9, is_candidate: false },
  { run_id: 1, method: "cosine_similarity", job_id: 11, title: "B", cluster_label: 1, candidate_cosine: 0.1, is_candidate: false },
  { run_id: 2, method: "cosine_similarity", job_id: 12, title: "C", cluster_label: 0, candidate_cosine: 0.5, is_candidate: false },
  { run_id: 1, method: "embedding_distance", job_id: 13, title: "D", cluster_label: 0, candidate_cosine: 0.7, is_candidate: false },
]

const jobDots = (c) => c.querySelectorAll('circle[data-point="job"]')

describe("ClusterScatter (issue #74)", () => {
  it("filters by method", () => {
    const { container } = render(<ClusterScatter points={points} method="cosine_similarity" />)
    expect(jobDots(container).length).toBe(3)
  })

  it("filters by runId when provided", () => {
    const { container } = render(<ClusterScatter points={points} method="cosine_similarity" runId={1} />)
    expect(jobDots(container).length).toBe(2)
  })

  it("renders empty placeholder when no scoped points", () => {
    const { getByText } = render(<ClusterScatter points={points} method="missing" />)
    expect(getByText(/No chart data yet/)).toBeInTheDocument()
  })

  it("uses absolute scale (high sim sits nearer the centre than low sim)", () => {
    const mk = (sim) => [{ run_id: 1, method: "cosine_similarity", job_id: 1, cluster_label: 0, candidate_cosine: sim, is_candidate: false }]
    const near = jobDots(render(<ClusterScatter points={mk(0.95)} method="cosine_similarity" />).container)[0]
    const far = jobDots(render(<ClusterScatter points={mk(0.05)} method="cosine_similarity" />).container)[0]
    const r = (el) => Number(el.getAttribute("data-radius"))
    expect(r(near)).toBeLessThan(r(far))
  })

  it("exposes a table fallback listing every scoped point", () => {
    const { getByRole } = render(<ClusterScatter points={points} method="cosine_similarity" runId={1} />)
    expect(getByRole("table", { name: /similarity/i })).toBeInTheDocument()
  })
})
