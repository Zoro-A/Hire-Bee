import { describe, it, expect } from "vitest"
import { getMatchBand } from "../lib/matching"

describe("getMatchBand (issue #73)", () => {
  it("returns Unscored band for non-finite score", () => {
    // Number(null) === 0 (finite), so use undefined which coerces to NaN
    const b = getMatchBand(undefined)
    expect(b.label).toBe("Unscored")
    expect(b.isTop).toBe(false)
    expect(b.borderClass).toContain("border-l-slate")
  })
  it("isTop=true when score >= 80", () => {
    const b = getMatchBand(85)
    expect(b.isTop).toBe(true)
    expect(b.label).toBe("Good match")
    expect(b.borderClass).toContain("border-l-emerald-500")
  })
  it("isTop=false for 70-79 Good match", () => {
    const b = getMatchBand(72)
    expect(b.isTop).toBe(false)
    expect(b.label).toBe("Good match")
    expect(b.borderClass).toContain("border-l-emerald-400")
  })
  it("Medium match for 40-69", () => {
    const b = getMatchBand(55)
    expect(b.label).toBe("Medium match")
    expect(b.borderClass).toContain("border-l-amber")
  })
  it("Bad match for <40", () => {
    const b = getMatchBand(20)
    expect(b.label).toBe("Bad match")
    expect(b.borderClass).toContain("border-l-rose")
  })
  it("chipClass present on every band", () => {
    ;[null, 90, 75, 50, 10].forEach((s) => {
      expect(getMatchBand(s).chipClass).toBeTruthy()
    })
  })
})
