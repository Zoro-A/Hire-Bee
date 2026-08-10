import { downloadAuthenticatedBlob } from "@/lib/api.js"
import { nativeSelectClass, cn } from "@/lib/utils.js"
import { StatusBadge } from "@/components/StatusBadge.jsx"
import { RecruiterStructuredCvPreview } from "@/components/cv/RecruiterStructuredCvPreview.jsx"
import { RECRUITER_STATUS_OPTIONS } from "@/constants/recruiter.js"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet.jsx"
import { useRecruiterData } from "../RecruiterDataContext.jsx"

export function ApplicantDetailSheet() {
  const {
    detailOpen,
    detailId,
    appDetail,
    detailLoading,
    closeApplicantDetail,
    updateApplicationStatus,
    loading,
    token,
    setError,
  } = useRecruiterData()

  return (
    <Sheet
      open={detailOpen}
      onOpenChange={(open) => {
        if (!open) closeApplicantDetail()
      }}
    >
      <SheetContent
        side="right"
        aria-labelledby="applicant-detail-title"
        className="w-full gap-0 border-surface-border bg-surface-raised p-0 sm:max-w-xl sm:rounded-l-2xl"
      >
        <SheetHeader className="shrink-0 border-b border-surface-border px-4 py-3">
          <SheetTitle id="applicant-detail-title" className="text-lg font-semibold text-ink">
            {detailId != null ? `Application #${detailId}` : "Application"}
          </SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {detailLoading && <p role="status" className="text-sm text-ink-muted">Loading application…</p>}
          {!detailLoading && appDetail && (
            <>
              <div>
                <p className="text-sm font-semibold text-ink">{appDetail.candidate_name}</p>
                <p className="text-xs text-ink-muted">{appDetail.candidate_email}</p>
                <p className="mt-2 text-sm text-ink">{appDetail.job_title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={appDetail.status} />
                  <select
                    className={cn(nativeSelectClass, "w-auto min-w-36")}
                    aria-label={`Update status for ${appDetail.candidate_name}`}
                    value={appDetail.status}
                    onChange={(e) => updateApplicationStatus(appDetail.application_id, e.target.value)}
                    disabled={loading.status[appDetail.application_id]}
                  >
                    {RECRUITER_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-surface-border pt-4">
                {appDetail.resume?.id != null && (
                  <button
                    type="button"
                    className="press rounded-lg border border-brand bg-surface-raised px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-soft"
                    onClick={() =>
                      downloadAuthenticatedBlob(
                        `/applications/recruiter/${appDetail.application_id}/resume-file`,
                        token,
                        appDetail.resume?.file_name || "resume",
                      ).catch((err) => setError(err.message))
                    }
                  >
                    Download resume file
                  </button>
                )}
                {appDetail.generated_cv?.has_pdf && (
                  <button
                    type="button"
                    className="press rounded-lg border border-brand bg-surface-raised px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-soft"
                    onClick={() =>
                      downloadAuthenticatedBlob(
                        `/applications/recruiter/${appDetail.application_id}/cv-download?export_format=pdf`,
                        token,
                        "cv.pdf",
                      ).catch((err) => setError(err.message))
                    }
                  >
                    Download CV (PDF)
                  </button>
                )}
                {appDetail.generated_cv?.has_docx && (
                  <button
                    type="button"
                    className="press rounded-lg border border-brand bg-surface-raised px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-soft"
                    onClick={() =>
                      downloadAuthenticatedBlob(
                        `/applications/recruiter/${appDetail.application_id}/cv-download?export_format=docx`,
                        token,
                        "cv.docx",
                      ).catch((err) => setError(err.message))
                    }
                  >
                    Download CV (DOCX)
                  </button>
                )}
              </div>
              {appDetail.cover_letter?.content != null && (
                <div>
                  <h3 className="text-sm font-semibold text-ink">Cover letter</h3>
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-surface-border bg-surface-subtle p-3 text-sm whitespace-pre-wrap">
                    {appDetail.cover_letter.content}
                  </div>
                </div>
              )}
              {appDetail.generated_cv?.cv_json && (
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    CV preview{appDetail.generated_cv.title ? ` — ${appDetail.generated_cv.title}` : ""}
                  </h3>
                  <div className="mt-2 max-h-[min(60vh,28rem)] overflow-y-auto">
                    <RecruiterStructuredCvPreview cvJson={appDetail.generated_cv.cv_json} />
                  </div>
                </div>
              )}
              {appDetail.resume?.parsed_data && (
                <div>
                  <h3 className="text-sm font-semibold text-ink">Parsed resume snapshot</h3>
                  <p className="mt-1 text-sm text-ink">
                    {appDetail.resume.parsed_data?.summary || appDetail.resume.parsed_data?.name || "Parsed fields available in export."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
