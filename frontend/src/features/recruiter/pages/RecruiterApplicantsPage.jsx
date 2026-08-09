import { cardClass } from "@/styles/uiClasses.js"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { useRecruiterData } from "../RecruiterDataContext.jsx"
import { ApplicantCard } from "../components/ApplicantCard.jsx"

export function RecruiterApplicantsPage() {
  const { sortedApps } = useRecruiterData()

  return (
    <section className="min-h-0 flex-1 overflow-y-auto pr-1">
      <PageHeader title="Applicants" />
      <article className={cardClass}>
        <h2 className="mb-1 font-semibold">Applicants</h2>
        <p className="mb-4 text-xs text-ink-muted">Select "View application" to open the cover letter and CV. Update status from the menu.</p>
        <div className="space-y-3">
          {sortedApps.length === 0 && <p className="text-sm text-ink-muted">No applications to your jobs yet.</p>}
          {sortedApps.map((app) => (
            <ApplicantCard key={app.application_id} app={app} />
          ))}
        </div>
      </article>
    </section>
  )
}
