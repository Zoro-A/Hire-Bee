import { Card } from "@/components/ui/card.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Button } from "@/components/ui/button.jsx"
import { nativeSelectClass } from "@/lib/utils.js"
import { useRecruiterData } from "../RecruiterDataContext.jsx"

export function InterviewScheduleForm() {
  const { apps, interviewForm, setInterviewForm, scheduleInterview, loading, interviewAppLabel } = useRecruiterData()

  return (
    <Card className="block gap-0 p-5">
      <h2 className="mb-1 font-display font-semibold text-ink">Schedule interview</h2>
      <p className="mb-4 text-xs text-ink-muted">Sets application status to interview and emails the candidate when SMTP is configured.</p>
      <form onSubmit={scheduleInterview} className="grid gap-3">
        <label className="text-xs font-medium text-ink-muted" htmlFor="interview-application">Application</label>
        <select
          id="interview-application"
          className={nativeSelectClass}
          value={interviewForm.application_id}
          onChange={(e) => setInterviewForm({ ...interviewForm, application_id: e.target.value })}
        >
          <option value="">Select application…</option>
          {apps.map((a) => (
            <option key={a.application_id} value={a.application_id}>
              {interviewAppLabel(a)}
            </option>
          ))}
        </select>
        <label className="text-xs font-medium text-ink-muted" htmlFor="interview-date">Date & time</label>
        <Input id="interview-date" type="datetime-local" value={interviewForm.interview_date} onChange={(e) => setInterviewForm({ ...interviewForm, interview_date: e.target.value })} />
        <Input aria-label="Meeting link" placeholder="Meeting link (Zoom, Meet, …)" value={interviewForm.meeting_link} onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })} />
        <Input aria-label="Notes" placeholder="Notes (optional)" value={interviewForm.notes} onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })} />
        <Button type="submit" aria-busy={loading.interview} disabled={loading.interview}>
          {loading.interview ? "Scheduling…" : "Schedule interview"}
        </Button>
      </form>
    </Card>
  )
}
