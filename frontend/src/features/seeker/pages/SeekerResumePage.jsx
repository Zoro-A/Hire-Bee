import { Card } from "@/components/ui/card.jsx"
import { Button } from "@/components/ui/button.jsx"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { useSeekerData } from "../SeekerDataContext.jsx"

export function SeekerResumePage() {
  const { uploadResume, loading, resumeInsight, user } = useSeekerData()

  return (
    <section className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      <PageHeader title="Upload Resume" description="Upload your resume for AI-powered analysis." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="block gap-0 p-5 lg:col-span-2">
          <form onSubmit={uploadResume} className="rounded-xl border border-dashed border-surface-border p-8 text-center">
            <label className="sr-only" htmlFor="resume-upload-file">
              Resume file (PDF or DOCX)
            </label>
            <input
              id="resume-upload-file"
              className="mx-auto block w-full max-w-xs text-sm"
              type="file"
              name="resume"
              accept=".pdf,.docx"
            />
            <Button disabled={loading.upload} aria-busy={loading.upload} className="mt-4" type="submit">{loading.upload ? "Uploading Resume..." : "Upload Resume"}</Button>
            <p className="mt-2 text-xs text-ink-muted">PDF or DOCX (max 10MB recommended)</p>
          </form>
          {loading.upload && (
            <div role="status" className="mt-4 rounded-xl border border-brand bg-brand-soft p-3">
              <p className="text-sm font-semibold text-brand-on-soft">Uploading Resume...</p>
            </div>
          )}
        </Card>
        <Card className="block gap-0 p-5">
          <h2 className="mb-3 font-display font-semibold text-ink">Profile Snapshot</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {resumeInsight?.parsed_data?.name || user.full_name}</p>
            <p><strong>Email:</strong> {resumeInsight?.parsed_data?.email || user.email}</p>
            <p><strong>Phone:</strong> {resumeInsight?.parsed_data?.phone || "Not detected yet"}</p>
            <p><strong>Confidence:</strong> {resumeInsight ? `${Math.round(resumeInsight.parsing_confidence * 100)}%` : "N/A"}</p>
          </div>
        </Card>
        <Card className="block gap-0 p-5">
          <h2 className="mb-3 font-display font-semibold text-ink">Extracted Content</h2>
          {resumeInsight ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-ink-muted">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {(resumeInsight.extracted_skills || []).map((skill) => (
                    <span key={skill} className="rounded-full bg-brand-soft px-2 py-1 text-xs text-brand-on-soft dark:bg-brand/15 dark:text-brand">{skill}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-ink-muted">Summary</p>
                <p className="rounded-xl border border-surface-border p-3 text-sm">{resumeInsight.parsed_data?.summary || "Summary not detected."}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Upload resume to view extraction cards.</p>
          )}
        </Card>
      </div>
    </section>
  )
}
