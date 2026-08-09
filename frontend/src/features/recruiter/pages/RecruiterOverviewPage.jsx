import { Link } from "react-router-dom"
import { cardClass } from "@/styles/uiClasses.js"
import { Metric } from "@/components/Metric.jsx"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { useRecruiterData } from "../RecruiterDataContext.jsx"

export function RecruiterOverviewPage() {
  const { user, myJobs, apps, interviews, logs } = useRecruiterData()

  return (
    <section className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      <PageHeader title="Overview" />
      <div className="grid gap-4">
        <div className="rounded-2xl border border-brand bg-gradient-to-br from-surface-raised to-brand-soft/40 p-6 dark:border-surface-dark-border dark:from-surface-dark-raised dark:to-brand/8">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-ink-dark-muted">Welcome back</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink dark:text-ink-dark">{user?.full_name || "Recruiter"}</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted dark:text-ink-dark-muted">
            Review applicants, move pipelines forward, and publish roles. Matches the HireBee recruiter workspace layout (sidebar + cards).
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Open roles" value={myJobs.length} />
          <Metric label="Applicants" value={apps.length} />
          <Metric label="Interviews" value={interviews.length} />
          <Metric label="Emails logged" value={logs.length} />
        </div>
        <article className={cardClass}>
          <h2 className="mb-3 font-semibold">Quick actions</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Link to="/app/recruiter/jobs" className="rounded-xl border border-surface-border p-4 text-left transition-transform duration-150 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-brand active:scale-[0.97] motion-reduce:hover:translate-y-0 dark:border-surface-dark-border">
              <p className="font-semibold text-ink dark:text-ink-dark">Post a job</p>
              <p className="text-xs text-ink-muted dark:text-ink-dark-muted">Title, description, required skills</p>
            </Link>
            <Link to="/app/recruiter/applicants" className="rounded-xl border border-surface-border p-4 text-left transition-transform duration-150 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-brand active:scale-[0.97] motion-reduce:hover:translate-y-0 dark:border-surface-dark-border">
              <p className="font-semibold text-ink dark:text-ink-dark">Review applicants</p>
              <p className="text-xs text-ink-muted dark:text-ink-dark-muted">Status and skill match</p>
            </Link>
            <Link to="/app/recruiter/interviews" className="rounded-xl border border-surface-border p-4 text-left transition-transform duration-150 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-brand active:scale-[0.97] motion-reduce:hover:translate-y-0 dark:border-surface-dark-border">
              <p className="font-semibold text-ink dark:text-ink-dark">Schedule interviews</p>
              <p className="text-xs text-ink-muted dark:text-ink-dark-muted">Link candidates to calendar</p>
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}
