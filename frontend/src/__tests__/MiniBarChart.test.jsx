import { describe, it, expect } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { MiniBarChart } from "../components/charts/MiniBarChart"

const items = [
  { method_label: "Cosine", avg_similarity: 0.847 },
  { method_label: "Embedding", avg_similarity: 0.5 },
]

describe("MiniBarChart", () => {
  it("renders one bar per item", () => {
    const { container } = render(
      <MiniBarChart items={items} valueKey="avg_similarity" labelKey="method_label" max={1} />,
    )
    // one <svg> bar-track per row, each with its own hover <title>
    const bars = container.querySelectorAll("svg")
    expect(bars).toHaveLength(items.length)
    const titles = Array.from(container.querySelectorAll("svg title")).map((t) => t.textContent)
    for (const item of items) {
      expect(titles.some((text) => text.startsWith(item.method_label))).toBe(true)
    }
  })

  it('renders "No chart data yet." for an empty array', () => {
    render(<MiniBarChart items={[]} valueKey="avg_similarity" labelKey="method_label" max={1} />)
    expect(screen.getByText("No chart data yet.")).toBeInTheDocument()
  })

  it("clamps a value above max to 100%", () => {
    const { container } = render(
      <MiniBarChart
        items={[{ method_label: "Over", avg_similarity: 1.5 }]}
        valueKey="avg_similarity"
        labelKey="method_label"
        max={1}
      />,
    )
    const fillRect = container.querySelectorAll("svg rect")[1] // [0]=track, [1]=fill
    expect(fillRect.getAttribute("width")).toBe("100")
    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("includes every label in the table fallback", () => {
    render(<MiniBarChart items={items} valueKey="avg_similarity" labelKey="method_label" max={1} />)
    const table = screen.getByRole("table")
    for (const item of items) {
      expect(within(table).getByText(item.method_label)).toBeInTheDocument()
    }
    // raw value preserved alongside the percentage
    expect(within(table).getByText("0.847")).toBeInTheDocument()
  })
})
