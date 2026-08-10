import { getSectionDisplayLabel, safeExternalUrl } from "@/lib/cv.js"
import { Card } from "@/components/ui/card.jsx"
import { isDownloadDisabled } from "@/lib/exportGuards"
import { useSeekerData } from "../SeekerDataContext.jsx"

export function CvLivePreview() {
  const {
    manualCv,
    manualSectionOrder,
    sectionExtraLabels,
    loading,
    selectedCvId,
    selectedCv,
    downloadCvOnly,
  } = useSeekerData()

  return (
    <Card className="gap-0 p-5 min-h-0 overflow-hidden">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h2 className="font-display font-semibold text-ink">Live CV Preview</h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {loading.convoCv && (
            <p className="text-xs text-brand dark:text-brand">Generation in progress — downloads paused…</p>
          )}
          <button
            type="button"
            disabled={isDownloadDisabled(loading, selectedCvId, selectedCv, "pdf")}
            onClick={() => downloadCvOnly("pdf")}
            className="press rounded-lg border border-brand bg-surface-raised px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download PDF
          </button>
          <button
            type="button"
            disabled={isDownloadDisabled(loading, selectedCvId, selectedCv, "docx")}
            onClick={() => downloadCvOnly("docx")}
            className="press rounded-lg border border-brand bg-surface-raised px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download DOCX
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
      <div className="rounded-xl border border-surface-border p-5">
        <h3 className="text-2xl font-semibold text-ink">{manualCv.full_name || "Your Name"}</h3>
        <p className="mt-1 text-sm text-ink-muted">
          {[manualCv.email, manualCv.phone, manualCv.location].filter(Boolean).join(" • ") || "email@example.com"}
        </p>
        {(manualCv.linkedin?.trim() || manualCv.github?.trim()) && (
          <p className="mt-2 flex flex-wrap gap-4 text-sm">
            {manualCv.linkedin?.trim() && (
              <a href={safeExternalUrl(manualCv.linkedin)} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">
                LinkedIn
              </a>
            )}
            {manualCv.github?.trim() && (
              <a href={safeExternalUrl(manualCv.github)} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">
                GitHub
              </a>
            )}
          </p>
        )}
        <hr className="my-4 border-surface-border" />
        {manualSectionOrder.map((key, pidx) => {
          const label = getSectionDisplayLabel(key, sectionExtraLabels)
          const raw = manualCv[key] ?? ""
          const emptyHint = key === "skills" ? "Add comma-separated skills." : `Add ${label.toLowerCase()}.`
          return (
            <div key={`preview-${key}`} className={pidx ? "mt-4" : ""}>
              <h4 className="font-semibold">{label}</h4>
              {key === "skills" ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {String(raw)
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((skill) => (
                      <span key={skill} className="rounded-full bg-brand-soft px-2 py-1 text-xs text-brand-on-soft dark:bg-brand/15 dark:text-brand">
                        {skill}
                      </span>
                    ))}
                  {!String(raw).trim() && <p className="mt-1 text-sm text-ink-muted">{emptyHint}</p>}
                </div>
              ) : key === "summary" ? (
                <p className="mt-1 text-sm">{raw || emptyHint}</p>
              ) : (
                <p className="mt-1 text-sm whitespace-pre-line">{raw || emptyHint}</p>
              )}
            </div>
          )
        })}
      </div>
      </div>
    </Card>
  )
}
