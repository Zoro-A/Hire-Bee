import { PiUsersThree } from "react-icons/pi"
import { cardClass } from "@/styles/uiClasses.js"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { EmptyState } from "@/components/feedback/EmptyState.jsx"
import { useRecruiterData } from "../RecruiterDataContext.jsx"
import { ApplicantCard } from "../components/ApplicantCard.jsx"

export function RecruiterApplicantsPage() {
  const { sortedApps } = useRecruiterData()

  return (
    <section className="min-h-0 flex-1 overflow-y-auto pr-1">
      <PageHeader title="Applicants" />
      <article className={cardClass}>
        <p className="mb-4 text-xs text-ink-muted">Select "View application" to open the cover letter and CV. Update status from the menu.</p>
        {sortedApps.length === 0 ? (
          <EmptyState
            icon={<PiUsersThree aria-hidden="true" />}
            title="No applications yet"
            description="Applicants will appear here once candidates apply to your jobs."
          />
        ) : (
          <div className="space-y-3">
            {sortedApps.map((app) => (
              <ApplicantCard key={app.application_id} app={app} />
            ))}
          </div>
        )}
      </article>
    </section>
  )
}
