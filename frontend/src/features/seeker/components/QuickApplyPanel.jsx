import { buttonClass, buttonGhostClass, inputClass } from "@/styles/uiClasses.js"
import { useSeekerData } from "../SeekerDataContext.jsx"

export function QuickApplyPanel({ job }) {
  const {
    coverLetterDraft,
    setCoverLetterDraft,
    selectedJobLetter,
    cvs,
    applyForm,
    setApplyForm,
    resumeId,
    uploadCvForQuickApply,
    loading,
    generateCoverLetter,
    saveCoverLetterEdits,
    applyToJob,
    hasAppliedToSelectedJob,
  } = useSeekerData()

  return (
    <>
      <h4 className="mt-4 font-semibold">Quick Apply</h4>
      <div className="mt-2 rounded-xl border border-surface-border p-3 text-sm dark:border-surface-dark-border">
        <p className="text-xs font-semibold uppercase text-ink-muted dark:text-ink-dark-muted">AI-generated cover letter</p>
        <textarea
          className={`${inputClass} mt-2 min-h-44`}
          value={coverLetterDraft}
          onChange={(e) => setCoverLetterDraft(e.target.value)}
          placeholder="Generate a cover letter, then edit it before applying."
        />
        <p className="mt-2 text-xs text-ink-muted dark:text-ink-dark-muted">
          {selectedJobLetter ? `Using cover letter #${selectedJobLetter.id}` : "No cover letter linked yet."}
        </p>
      </div>
      <div className="mt-3 rounded-xl border border-surface-border p-3 text-sm dark:border-surface-dark-border">
        <p className="text-xs font-semibold uppercase text-ink-muted dark:text-ink-dark-muted">Attached CV</p>
        <select
          className={`${inputClass} mt-2`}
          value={applyForm.generated_cv_id}
          onChange={(e) => setApplyForm((prev) => ({ ...prev, generated_cv_id: e.target.value }))}
        >
          <option value="">Select from saved CVs</option>
          {cvs.map((cv) => (
            <option key={cv.id} value={cv.id}>
              {cv.title} (#{cv.id})
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-ink-muted dark:text-ink-dark-muted">
          {applyForm.generated_cv_id
            ? `Using saved CV: ${cvs.find((cv) => String(cv.id) === String(applyForm.generated_cv_id))?.title || "Selected"}`
            : resumeId
              ? `Using uploaded CV/Resume ID: ${resumeId}`
              : "No CV selected yet"}
        </p>
        <label className="mt-3 block text-xs font-semibold uppercase text-ink-muted dark:text-ink-dark-muted">Or upload a new CV (PDF/DOCX)</label>
        <input
          type="file"
          accept=".pdf,.docx"
          className="mt-2 block w-full text-xs"
          onChange={(e) => uploadCvForQuickApply(e.target.files?.[0])}
        />
        {loading.cvUpload && <p className="mt-2 text-xs text-brand">Uploading and attaching new CV...</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={buttonClass} type="button" disabled={loading.coverLetter} onClick={() => generateCoverLetter(job.id)}>{loading.coverLetter ? "Generating..." : "Generate Cover Letter"}</button>
        <button className={buttonGhostClass} type="button" disabled={loading.coverLetterSave || !applyForm.cover_letter_id} onClick={saveCoverLetterEdits}>{loading.coverLetterSave ? "Saving..." : "Save Cover Letter"}</button>
        <button className={buttonClass} type="button" disabled={loading.apply || hasAppliedToSelectedJob} onClick={applyToJob}>{loading.apply ? "Applying..." : hasAppliedToSelectedJob ? "Already Applied" : "Apply Now"}</button>
      </div>
    </>
  )
}
