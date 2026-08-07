import { cardClass, inputClass, buttonClass } from "@/styles/uiClasses.js"
import { useRecruiterData } from "../RecruiterDataContext.jsx"

export function InterviewScheduleForm() {
  const { apps, interviewForm, setInterviewForm, scheduleInterview, loading, interviewAppLabel } = useRecruiterData()

  return (
    <article className={cardClass}>
      <h3 className="mb-1 font-semibold">Schedule interview</h3>
      <p className="mb-4 text-xs text-ink-muted dark:text-ink-dark-muted">Sets application status to interview and emails the candidate when SMTP is configured.</p>
      <form onSubmit={scheduleInterview} className="grid gap-3">
        <label className="text-xs font-medium text-ink-muted dark:text-ink-dark-muted">Application</label>
        <select
          className={inputClass}
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
        <label className="text-xs font-medium text-ink-muted dark:text-ink-dark-muted">Date & time</label>
        <input className={inputClass} type="datetime-local" value={interviewForm.interview_date} onChange={(e) => setInterviewForm({ ...interviewForm, interview_date: e.target.value })} />
        <input className={inputClass} placeholder="Meeting link (Zoom, Meet, …)" value={interviewForm.meeting_link} onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })} />
        <input className={inputClass} placeholder="Notes (optional)" value={interviewForm.notes} onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })} />
        <button className={buttonClass} type="submit" disabled={loading.interview}>
          {loading.interview ? "Scheduling…" : "Schedule interview"}
        </button>
      </form>
    </article>
  )
}
