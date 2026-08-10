import { describe, it, expect } from "vitest"
import { SEEKER_NAV, RECRUITER_NAV, ADMIN_NAV } from "@/config/nav"

describe("nav config", () => {
  it("every entry has a unique absolute route, a label and an icon", () => {
    for (const nav of [SEEKER_NAV, RECRUITER_NAV, ADMIN_NAV]) {
      const routes = nav.map((n) => n.to)
      expect(new Set(routes).size).toBe(routes.length)
      for (const item of nav) {
        expect(item.to.startsWith("/app/")).toBe(true)
        expect(item.label.length).toBeGreaterThan(0)
        expect(typeof item.Icon).toBe("function")
      }
    }
  })

  it("keeps the labels the e2e suite navigates by", () => {
    const seeker = SEEKER_NAV.map((n) => n.label)
    expect(seeker).toContain("Generate CV")
    expect(seeker).toContain("Evaluation")
    expect(RECRUITER_NAV.map((n) => n.label)).toContain("Applicants")
  })
})
