import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { ClusterScatter } from "../components/charts/ClusterScatter"

const points = [
  { run_id: 1, method: "cosine_similarity", job_id: 10, title: "A", cluster_label: 0, candidate_cosine: 0.9, is_candidate: false },
  { run_id: 1, method: "cosine_similarity", job_id: 11, title: "B", cluster_label: 1, candidate_cosine: 0.1, is_candidate: false },
  { run_id: 2, method: "cosine_similarity", job_id: 12, title: "C", cluster_label: 0, candidate_cosine: 0.5, is_candidate: false },
  { run_id: 1, method: "embedding_distance", job_id: 13, title: "D", cluster_label: 0, candidate_cosine: 0.7, is_candidate: false },
]

describe("ClusterScatter (issue #74)", () => {
  it("filters by method", () => {
    const { container } = render(<ClusterScatter points={points} method="cosine_similarity" />)
    // 3 points have method=cosine
    expect(container.querySelectorAll("div[style*='left']").length).toBe(3)
  })
  it("filters by runId when provided", () => {
    const { container } = render(<ClusterScatter points={points} method="cosine_similarity" runId={1} />)
    // 2 points have method=cosine AND run_id=1
    expect(container.querySelectorAll("div[style*='left']").length).toBe(2)
  })
  it("renders empty placeholder when no scoped points", () => {
    const { getByText } = render(<ClusterScatter points={points} method="missing" />)
    expect(getByText(/No chart data yet/)).toBeInTheDocument()
  })
  it("uses absolute scale (high sim sits near center, low sim near edge)", () => {
    const close = [
      { run_id: 1, method: "cosine_similarity", job_id: 1, cluster_label: 0, candidate_cosine: 0.95, is_candidate: false },
    ]
    const far = [
      { run_id: 1, method: "cosine_similarity", job_id: 1, cluster_label: 0, candidate_cosine: 0.05, is_candidate: false },
    ]
    const c1 = render(<ClusterScatter points={close} method="cosine_similarity" />).container
    const c2 = render(<ClusterScatter points={far} method="cosine_similarity" />).container
    // pull radius from inline style "left: X%"; high sim → small radius → left close to 50%
    const dot1 = c1.querySelector("div[style*='left']")
    const dot2 = c2.querySelector("div[style*='left']")
    const left1 = Number(dot1.style.left.replace("%", ""))
    const left2 = Number(dot2.style.left.replace("%", ""))
    // distance from 50 should be smaller for high sim
    expect(Math.abs(left1 - 50)).toBeLessThan(Math.abs(left2 - 50))
  })
})
