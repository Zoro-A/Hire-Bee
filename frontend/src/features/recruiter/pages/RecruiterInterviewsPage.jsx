import { PiCalendarX } from "react-icons/pi"
import { Card } from "@/components/ui/card.jsx"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { EmptyState } from "@/components/feedback/EmptyState.jsx"
import { useRecruiterData } from "../RecruiterDataContext.jsx"
import { InterviewScheduleForm } from "../components/InterviewScheduleForm.jsx"

export function RecruiterInterviewsPage() {
  const { interviews } = useRecruiterData()

  return (
    <section className="min-h-0 flex-1 overflow-y-auto pr-1">
      <PageHeader title="Interviews" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="block gap-0 p-5">
          <h2 className="mb-1 font-display font-semibold text-ink">Upcoming</h2>
          <p className="mb-4 text-xs text-ink-muted">Scheduled interviews for your roles.</p>
          {interviews.length === 0 ? (
            <EmptyState
              icon={<PiCalendarX aria-hidden="true" />}
              title="No interviews scheduled"
              description="Schedule one from the form to see it listed here."
            />
          ) : (
            <div className="max-h-96 space-y-2 overflow-auto text-sm">
              {interviews.map((inv) => (
                <div key={inv.id} className="rounded-xl border border-surface-border p-3">
                  <p className="font-medium text-ink">{new Date(inv.interview_date).toLocaleString()}</p>
                  <p className="mt-1 break-all text-xs text-brand">{inv.meeting_link}</p>
                  {inv.notes && <p className="mt-1 text-xs text-ink-muted">{inv.notes}</p>}
                  <p className="mt-1 text-xs text-ink-faint">Application #{inv.application_id}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
        <InterviewScheduleForm />
      </div>
    </section>
  )
}
