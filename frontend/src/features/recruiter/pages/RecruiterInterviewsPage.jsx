import { cardClass } from "@/styles/uiClasses.js"
import { useRecruiterData } from "../RecruiterDataContext.jsx"
import { InterviewScheduleForm } from "../components/InterviewScheduleForm.jsx"

export function RecruiterInterviewsPage() {
  const { interviews } = useRecruiterData()

  return (
    <section className="min-h-0 flex-1 overflow-y-auto pr-1">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className={cardClass}>
          <h3 className="mb-1 font-semibold">Upcoming</h3>
          <p className="mb-4 text-xs text-ink-muted dark:text-ink-dark-muted">Scheduled interviews for your roles.</p>
          <div className="max-h-[24rem] space-y-2 overflow-auto text-sm">
            {interviews.length === 0 && <p className="text-ink-muted dark:text-ink-dark-muted">No interviews scheduled.</p>}
            {interviews.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-surface-border p-3 dark:border-surface-dark-border">
                <p className="font-medium text-ink dark:text-ink-dark">{new Date(inv.interview_date).toLocaleString()}</p>
                <p className="mt-1 break-all text-xs text-brand">{inv.meeting_link}</p>
                {inv.notes && <p className="mt-1 text-xs text-ink-muted dark:text-ink-dark-muted">{inv.notes}</p>}
                <p className="mt-1 text-xs text-ink-faint dark:text-ink-dark-faint">Application #{inv.application_id}</p>
              </div>
            ))}
          </div>
        </article>
        <InterviewScheduleForm />
      </div>
    </section>
  )
}
