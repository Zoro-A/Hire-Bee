import { describe, it, expect } from "vitest"

// Mirrors the disabled prop expression used in CvLivePreview.jsx for the
// preview Download buttons after the issue #72 fix.
function isDownloadDisabled(loading, selectedCvId, selectedCv, format) {
  const pathPresent = format === "pdf" ? !!selectedCv?.pdf_path : !!selectedCv?.docx_path
  return Boolean(loading.export || loading.convoCv || !selectedCvId || !pathPresent)
}

describe("export download guards (issue #72)", () => {
  const baseLoading = { export: false, convoCv: false }
  const cvReady = { pdf_path: "/a.pdf", docx_path: "/a.docx" }

  it("enabled when nothing in progress and paths ready", () => {
    expect(isDownloadDisabled(baseLoading, "1", cvReady, "pdf")).toBe(false)
    expect(isDownloadDisabled(baseLoading, "1", cvReady, "docx")).toBe(false)
  })
  it("disabled while convoCv generation in progress", () => {
    expect(isDownloadDisabled({ ...baseLoading, convoCv: true }, "1", cvReady, "pdf")).toBe(true)
    expect(isDownloadDisabled({ ...baseLoading, convoCv: true }, "1", cvReady, "docx")).toBe(true)
  })
  it("disabled while export already running", () => {
    expect(isDownloadDisabled({ ...baseLoading, export: true }, "1", cvReady, "pdf")).toBe(true)
  })
  it("disabled when no cv selected", () => {
    expect(isDownloadDisabled(baseLoading, "", cvReady, "pdf")).toBe(true)
  })
  it("disabled when path missing for the requested format", () => {
    expect(isDownloadDisabled(baseLoading, "1", { pdf_path: "/a.pdf" }, "docx")).toBe(true)
    expect(isDownloadDisabled(baseLoading, "1", { docx_path: "/a.docx" }, "pdf")).toBe(true)
  })
})
