import { cardClass, buttonClass } from "@/styles/uiClasses.js"
import { useSeekerData } from "../SeekerDataContext.jsx"

export function SeekerResumePage() {
  const { uploadResume, loading, resumeInsight, user } = useSeekerData()

  return (
    <section className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      <div className="grid gap-6 lg:grid-cols-2">
        <article className={`${cardClass} lg:col-span-2`}>
          <h3 className="mb-2 text-xl font-semibold">Upload Resume</h3>
          <p className="text-sm text-ink-muted dark:text-ink-dark-muted">Upload your resume for AI-powered analysis.</p>
          <form onSubmit={uploadResume} className="mt-4 rounded-xl border border-dashed border-surface-border p-8 text-center dark:border-surface-dark-border">
            <input className="mx-auto block w-full max-w-xs text-sm" type="file" name="resume" accept=".pdf,.docx" />
            <button disabled={loading.upload} className={`${buttonClass} mt-4`} type="submit">{loading.upload ? "Uploading Resume..." : "Upload Resume"}</button>
            <p className="mt-2 text-xs text-ink-muted dark:text-ink-dark-muted">PDF or DOCX (max 10MB recommended)</p>
          </form>
          {loading.upload && (
            <div className="mt-4 rounded-xl border border-brand bg-brand-soft p-3">
              <p className="text-sm font-semibold text-brand-on-soft">Uploading Resume...</p>
            </div>
          )}
        </article>
        <article className={cardClass}>
          <h3 className="mb-3 font-semibold">Profile Snapshot</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {resumeInsight?.parsed_data?.name || user.full_name}</p>
            <p><strong>Email:</strong> {resumeInsight?.parsed_data?.email || user.email}</p>
            <p><strong>Phone:</strong> {resumeInsight?.parsed_data?.phone || "Not detected yet"}</p>
            <p><strong>Confidence:</strong> {resumeInsight ? `${Math.round(resumeInsight.parsing_confidence * 100)}%` : "N/A"}</p>
          </div>
        </article>
        <article className={cardClass}>
          <h3 className="mb-3 font-semibold">Extracted Content</h3>
          {resumeInsight ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-ink-muted dark:text-ink-dark-muted">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {(resumeInsight.extracted_skills || []).map((skill) => (
                    <span key={skill} className="rounded-full bg-brand-soft px-2 py-1 text-xs text-brand-on-soft dark:bg-brand/15 dark:text-brand">{skill}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-ink-muted dark:text-ink-dark-muted">Summary</p>
                <p className="rounded-xl border border-surface-border p-3 text-sm dark:border-surface-dark-border">{resumeInsight.parsed_data?.summary || "Summary not detected."}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-muted dark:text-ink-dark-muted">Upload resume to view extraction cards.</p>
          )}
        </article>
      </div>
    </section>
  )
}
