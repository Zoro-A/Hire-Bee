import { PiBriefcase } from "react-icons/pi"
import { Card } from "@/components/ui/card.jsx"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { EmptyState } from "@/components/feedback/EmptyState.jsx"
import { useRecruiterData } from "../RecruiterDataContext.jsx"
import { JobPostForm } from "../components/JobPostForm.jsx"

export function RecruiterJobsPage() {
  const { myJobs } = useRecruiterData()

  return (
    <section className="min-h-0 flex-1 overflow-y-auto pr-1">
      <PageHeader title="Jobs" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="block gap-0 p-5">
          <h2 className="mb-1 font-display font-semibold text-ink">Your listings</h2>
          <p className="mb-4 text-xs text-ink-muted">Filtered by recruiter email on the job record.</p>
          {myJobs.length === 0 ? (
            <EmptyState
              icon={<PiBriefcase aria-hidden="true" />}
              title="No jobs yet"
              description="Create your recruiter profile (Company) then publish a role."
            />
          ) : (
            <div className="max-h-112 space-y-2 overflow-auto">
              {myJobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-surface-border p-3 text-sm">
                  <p className="font-semibold text-ink">{job.title}</p>
                  <p className="text-xs text-ink-muted">{job.location || "Remote"} · {job.salary != null ? `$${Number(job.salary).toLocaleString()}` : "Salary TBD"}</p>
                  {job.required_skills?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {job.required_skills.map((s) => (
                        <span key={s} className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand-on-soft dark:bg-brand/15 dark:text-brand">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
        <JobPostForm />
      </div>
    </section>
  )
}
