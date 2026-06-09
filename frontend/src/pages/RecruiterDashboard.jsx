import { useEffect, useMemo, useState } from "react"
import { useTheme } from "../context/ThemeContext.jsx"
import { apiRequest, downloadAuthenticatedBlob } from "../lib/api.js"
import { getMatchBand } from "../lib/matching.js"
import { cardClass, inputClass, buttonClass, buttonGhostClass } from "../styles/uiClasses.js"
import { Metric } from "../components/Metric.jsx"
import { StatusBadge } from "../components/StatusBadge.jsx"
import { RecruiterStructuredCvPreview } from "../components/cv/RecruiterStructuredCvPreview.jsx"
import { RECRUITER_STATUS_OPTIONS } from "../constants/recruiter.js"

export function RecruiterDashboard({ token, user }) {
  const { isDark } = useTheme()
  const navItems = [
    { key: "overview", label: "Overview" },
    { key: "jobs", label: "Jobs" },
    { key: "applicants", label: "Applicants" },
    { key: "interviews", label: "Interviews" },
    { key: "emails", label: "Email logs" },
    { key: "profile", label: "Company" },
  ]
  const [activePage, setActivePage] = useState("overview")
  const [jobs, setJobs] = useState([])
  const [apps, setApps] = useState([])
  const [interviews, setInterviews] = useState([])
  const [logs, setLogs] = useState([])
  const [recruiterMeta, setRecruiterMeta] = useState(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState({ refresh: false, profile: false, job: false, interview: false, status: {} })
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    salary: "",
    recruiter_email: user?.email ?? "",
    required_skills: "python, fastapi, postgresql",
  })
  const [interviewForm, setInterviewForm] = useState({ application_id: "", interview_date: "", meeting_link: "", notes: "" })
  const [profile, setProfile] = useState({ company_name: "", recruiter_email: user?.email ?? "" })
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [appDetail, setAppDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const myJobs = useMemo(() => {
    const email = (recruiterMeta?.recruiter_email || user?.email || "").toLowerCase()
    if (!email) return jobs
    return jobs.filter((j) => (j.recruiter_email || "").toLowerCase() === email)
  }, [jobs, recruiterMeta, user])

  const sortedApps = useMemo(() => {
    return [...(apps || [])].sort((a, b) => {
      const av = Number.isFinite(Number(a.match_percentage)) ? Number(a.match_percentage) : -1
      const bv = Number.isFinite(Number(b.match_percentage)) ? Number(b.match_percentage) : -1
      return bv - av
    })
  }, [apps])

  const refresh = useMemo(() => async () => {
    setLoading((p) => ({ ...p, refresh: true }))
    setError("")
    try {
      const [jobList, appList, interviewList, emailList, profileRes] = await Promise.all([
        apiRequest("/jobs", {}, token),
        apiRequest("/applications/recruiter", {}, token).catch(() => []),
        apiRequest("/interviews/recruiter", {}, token).catch(() => []),
        apiRequest("/emails/logs", {}, token).catch(() => []),
        apiRequest("/recruiters/profile", {}, token).catch(() => null),
      ])
      setJobs(jobList)
      setApps(appList)
      setInterviews(interviewList)
      setLogs(emailList)
      setRecruiterMeta(profileRes)
      if (profileRes) {
        setProfile({ company_name: profileRes.company_name || "", recruiter_email: profileRes.recruiter_email || "" })
        setForm((f) => ({ ...f, recruiter_email: profileRes.recruiter_email || f.recruiter_email }))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((p) => ({ ...p, refresh: false }))
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().catch(() => {})
  }, [refresh])

  async function saveProfile(e) {
    e.preventDefault()
    setLoading((p) => ({ ...p, profile: true }))
    setError("")
    setMessage("")
    try {
      await apiRequest("/recruiters/profile", { method: "POST", body: JSON.stringify(profile) }, token)
      setMessage("Company profile saved.")
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((p) => ({ ...p, profile: false }))
    }
  }

  async function postJob(e) {
    e.preventDefault()
    setLoading((p) => ({ ...p, job: true }))
    setError("")
    setMessage("")
    try {
      await apiRequest("/jobs", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          salary: form.salary ? Number(form.salary) : null,
          required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      }, token)
      setMessage("Job published and skills indexed for matching.")
      setForm((f) => ({ ...f, title: "", description: "", location: "", salary: "" }))
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((p) => ({ ...p, job: false }))
    }
  }

  async function updateApplicationStatus(applicationId, status) {
    setLoading((p) => ({ ...p, status: { ...p.status, [applicationId]: true } }))
    setError("")
    setMessage("")
    try {
      await apiRequest(`/applications/${applicationId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, token)
      setMessage("Application status updated.")
      await refresh()
      if (detailOpen && detailId === applicationId) {
        const d = await apiRequest(`/applications/recruiter/${applicationId}/detail`, {}, token)
        setAppDetail(d)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((p) => ({ ...p, status: { ...p.status, [applicationId]: false } }))
    }
  }

  async function scheduleInterview(e) {
    e.preventDefault()
    setLoading((p) => ({ ...p, interview: true }))
    setError("")
    setMessage("")
    const aid = Number(interviewForm.application_id)
    if (!aid || Number.isNaN(aid)) {
      setError("Choose an application from the list.")
      setLoading((p) => ({ ...p, interview: false }))
      return
    }
    if (!interviewForm.interview_date || !interviewForm.meeting_link?.trim()) {
      setError("Set interview date/time and meeting link.")
      setLoading((p) => ({ ...p, interview: false }))
      return
    }
    try {
      await apiRequest("/interviews/schedule", {
        method: "POST",
        body: JSON.stringify({
          application_id: aid,
          interview_date: new Date(interviewForm.interview_date).toISOString(),
          meeting_link: interviewForm.meeting_link.trim(),
          notes: interviewForm.notes?.trim() || null,
        }),
      }, token)
      setMessage("Interview scheduled and candidate notified (if SMTP is configured).")
      setInterviewForm({ application_id: "", interview_date: "", meeting_link: "", notes: "" })
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((p) => ({ ...p, interview: false }))
    }
  }

  const interviewAppLabel = (a) => `#${a.application_id} · ${a.candidate_name} · ${a.job_title}`

  function closeApplicantDetail() {
    setDetailOpen(false)
    setDetailId(null)
    setAppDetail(null)
    setDetailLoading(false)
  }

  async function openApplicantDetail(applicationId) {
    setDetailId(applicationId)
    setDetailOpen(true)
    setDetailLoading(true)
    setAppDetail(null)
    setError("")
    try {
      const d = await apiRequest(`/applications/recruiter/${applicationId}/detail`, {}, token)
      setAppDetail(d)
    } catch (err) {
      setError(err.message)
      closeApplicantDetail()
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <>
    <section className="flex h-full min-h-0 w-full flex-col gap-4 lg:flex-row lg:gap-4">
      <aside className="glass-panel flex max-h-[min(40vh,320px)] shrink-0 flex-col overflow-y-auto rounded-2xl p-4 lg:max-h-none lg:h-full lg:min-h-0 lg:w-55">
        <div className="border-b border-surface-border pb-4 dark:border-surface-dark-border">
          <p className="text-xs uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted">HireBee</p>
          <p className="mt-1 text-lg font-semibold text-ink dark:text-ink-dark">Recruiter</p>
          <p className="mt-1 truncate text-xs text-ink-faint dark:text-ink-dark-faint">{recruiterMeta?.company_name || "Your workspace"}</p>
        </div>
        <nav className="mt-4 grid gap-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActivePage(item.key)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition ${activePage === item.key ? "bg-accent text-white" : "text-ink-muted hover:bg-surface-subtle hover:text-ink dark:text-ink-dark-muted dark:hover:bg-surface-dark-subtle dark:hover:text-ink-dark"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-8 border-t border-surface-border pt-3 text-xs text-ink-faint dark:border-surface-dark-border dark:text-ink-dark-faint">
          Theme: {isDark ? "Dark" : "Light"}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {message && <p className="shrink-0 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{message}</p>}
        {error && <p className="shrink-0 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

        {activePage === "overview" && (
          <section className="grid gap-4">
            <div className="rounded-2xl border border-accent-muted bg-gradient-to-br from-surface-raised to-accent-light/40 p-6 dark:border-surface-dark-border dark:from-surface-dark-raised dark:to-accent/8">
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
              <h3 className="mb-3 font-semibold">Quick actions</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <button type="button" onClick={() => setActivePage("jobs")} className="card-hover rounded-xl border border-surface-border p-4 text-left transition hover:border-accent dark:border-surface-dark-border">
                  <p className="font-semibold text-ink dark:text-ink-dark">Post a job</p>
                  <p className="text-xs text-ink-muted dark:text-ink-dark-muted">Title, description, required skills</p>
                </button>
                <button type="button" onClick={() => setActivePage("applicants")} className="card-hover rounded-xl border border-surface-border p-4 text-left transition hover:border-accent dark:border-surface-dark-border">
                  <p className="font-semibold text-ink dark:text-ink-dark">Review applicants</p>
                  <p className="text-xs text-ink-muted dark:text-ink-dark-muted">Status and skill match</p>
                </button>
                <button type="button" onClick={() => setActivePage("interviews")} className="card-hover rounded-xl border border-surface-border p-4 text-left transition hover:border-accent dark:border-surface-dark-border">
                  <p className="font-semibold text-ink dark:text-ink-dark">Schedule interviews</p>
                  <p className="text-xs text-ink-muted dark:text-ink-dark-muted">Link candidates to calendar</p>
                </button>
              </div>
            </article>
          </section>
        )}

        {activePage === "jobs" && (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <article className={cardClass}>
              <h3 className="mb-1 font-semibold">Your listings</h3>
              <p className="mb-4 text-xs text-ink-muted dark:text-ink-dark-muted">Filtered by recruiter email on the job record.</p>
              <div className="max-h-[28rem] space-y-2 overflow-auto">
                {myJobs.length === 0 && <p className="text-sm text-ink-muted dark:text-ink-dark-muted">No jobs yet — create your recruiter profile (Company) then publish a role.</p>}
                {myJobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-surface-border p-3 text-sm dark:border-surface-dark-border">
                    <p className="font-semibold text-ink dark:text-ink-dark">{job.title}</p>
                    <p className="text-xs text-ink-muted dark:text-ink-dark-muted">{job.location || "Remote"} · {job.salary != null ? `$${Number(job.salary).toLocaleString()}` : "Salary TBD"}</p>
                    {job.required_skills?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {job.required_skills.map((s) => (
                          <span key={s} className="rounded-full bg-accent-light px-2 py-0.5 text-xs text-accent-text dark:bg-accent/15 dark:text-accent">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
            <article className={cardClass}>
              <h3 className="mb-1 font-semibold">Publish new role</h3>
              <p className="mb-4 text-xs text-ink-muted dark:text-ink-dark-muted">Required skills are normalized for ATS matching and Qdrant indexing.</p>
              <form onSubmit={postJob} className="grid gap-3">
                <input className={inputClass} placeholder="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <textarea className={`${inputClass} min-h-[100px]`} placeholder="Role description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputClass} placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  <input className={inputClass} placeholder="Annual salary (number)" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
                </div>
                <input className={inputClass} placeholder="Contact email on listing" value={form.recruiter_email} onChange={(e) => setForm({ ...form, recruiter_email: e.target.value })} required />
                <input className={inputClass} placeholder="Required skills (comma separated)" value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} />
                <button className={buttonClass} type="submit" disabled={loading.job}>
                  {loading.job ? "Publishing…" : "Publish job"}
                </button>
              </form>
            </article>
          </section>
        )}

        {activePage === "applicants" && (
          <article className={cardClass}>
            <h3 className="mb-1 font-semibold">Applicants</h3>
            <p className="mb-4 text-xs text-ink-muted dark:text-ink-dark-muted">Click a candidate to open cover letter and CV. Use the status menu without clicking the card body.</p>
            <div className="space-y-3">
              {sortedApps.length === 0 && <p className="text-sm text-ink-muted dark:text-ink-dark-muted">No applications to your jobs yet.</p>}
              {sortedApps.map((app) => {
                const badge = getMatchBand(app.match_percentage)
                const hasScore = app.match_percentage != null && Number.isFinite(Number(app.match_percentage))
                return (
                <div
                  key={app.application_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openApplicantDetail(app.application_id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      openApplicantDetail(app.application_id)
                    }
                  }}
                  className={`cursor-pointer rounded-xl border ${badge.borderClass} p-4 transition hover:border-accent hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {hasScore ? (
                          <span className={`rounded-md px-2.5 py-1 text-sm font-bold ${badge.chipClass}`}>
                            {Math.round(Number(app.match_percentage))}% match
                          </span>
                        ) : (
                          <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${badge.chipClass}`}>
                            Unscored
                          </span>
                        )}
                        {badge.isTop && (
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            ★ Top match
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${badge.textClass}`}>
                          <span className={`inline-block h-2 w-2 rounded-full ${badge.dotClass}`} />
                          {badge.label}
                        </span>
                      </div>
                      <p className="font-semibold text-ink dark:text-ink-dark">{app.candidate_name}</p>
                      <p className="text-xs text-ink-muted dark:text-ink-dark-muted">{app.candidate_email}</p>
                      <p className="mt-1 text-sm text-ink dark:text-ink-dark">{app.job_title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={app.status} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <select
                        className={inputClass}
                        value={app.status}
                        onChange={(e) => updateApplicationStatus(app.application_id, e.target.value)}
                        disabled={loading.status[app.application_id]}
                      >
                        {RECRUITER_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {(app.matched_skills?.length > 0 || app.missing_skills?.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-4 border-t border-surface-border pt-3 text-xs dark:border-surface-dark-border">
                      {app.matched_skills?.length > 0 && (
                        <div>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">Matched</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {app.matched_skills.map((s) => (
                              <span key={s} className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {app.missing_skills?.length > 0 && (
                        <div>
                          <span className="font-semibold text-rose-700 dark:text-rose-400">Missing</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {app.missing_skills.map((s) => (
                              <span key={s} className="rounded bg-rose-50 px-2 py-0.5 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          </article>
        )}

        {activePage === "interviews" && (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <article className={cardClass}>
              <h3 className="mb-1 font-semibold">Upcoming</h3>
              <p className="mb-4 text-xs text-ink-muted dark:text-ink-dark-muted">Scheduled interviews for your roles.</p>
              <div className="max-h-[24rem] space-y-2 overflow-auto text-sm">
                {interviews.length === 0 && <p className="text-ink-muted dark:text-ink-dark-muted">No interviews scheduled.</p>}
                {interviews.map((inv) => (
                  <div key={inv.id} className="rounded-xl border border-surface-border p-3 dark:border-surface-dark-border">
                    <p className="font-medium text-ink dark:text-ink-dark">{new Date(inv.interview_date).toLocaleString()}</p>
                    <p className="mt-1 break-all text-xs text-accent">{inv.meeting_link}</p>
                    {inv.notes && <p className="mt-1 text-xs text-ink-muted dark:text-ink-dark-muted">{inv.notes}</p>}
                    <p className="mt-1 text-xs text-ink-faint dark:text-ink-dark-faint">Application #{inv.application_id}</p>
                  </div>
                ))}
              </div>
            </article>
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
          </section>
        )}

        {activePage === "emails" && (
          <article className={cardClass}>
            <h3 className="mb-1 font-semibold">Email automation</h3>
            <p className="mb-4 text-xs text-ink-muted dark:text-ink-dark-muted">Recent platform sends (applications, interviews, password reset).</p>
            <div className="overflow-x-auto rounded-xl border border-surface-border dark:border-surface-dark-border">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-surface-border bg-surface-subtle text-xs font-semibold uppercase text-ink-muted dark:border-surface-dark-border dark:bg-surface-dark-subtle dark:text-ink-dark-muted">
                  <tr>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Recipient</th>
                    <th className="px-3 py-2">Subject</th>
                    <th className="px-3 py-2">When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 40).map((log) => (
                    <tr key={log.id} className="border-b border-surface-border last:border-0 dark:border-surface-dark-border">
                      <td className="px-3 py-2 font-medium text-ink dark:text-ink-dark">{log.status}</td>
                      <td className="px-3 py-2 text-ink-muted dark:text-ink-dark-muted">{log.recipient}</td>
                      <td className="px-3 py-2 text-ink dark:text-ink-dark">{log.subject}</td>
                      <td className="px-3 py-2 text-xs text-ink-muted dark:text-ink-dark-muted">{log.created_at ? new Date(log.created_at).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && <p className="p-4 text-sm text-ink-muted dark:text-ink-dark-muted">No email rows yet.</p>}
            </div>
          </article>
        )}

        {activePage === "profile" && (
          <article className={`${cardClass} max-w-xl`}>
            <h3 className="mb-1 font-semibold">Company profile</h3>
            <p className="mb-4 text-xs text-ink-muted dark:text-ink-dark-muted">Create once via API; if you already have a profile, saving again may return an error — use the same email as on your job posts.</p>
            <form onSubmit={saveProfile} className="grid gap-3">
              <input className={inputClass} placeholder="Company name" value={profile.company_name} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} required />
              <input className={inputClass} placeholder="Recruiting contact email" value={profile.recruiter_email} onChange={(e) => setProfile({ ...profile, recruiter_email: e.target.value })} required />
              <button className={buttonClass} type="submit" disabled={loading.profile}>
                {loading.profile ? "Saving…" : recruiterMeta ? "Update (re-create if blocked)" : "Create profile"}
              </button>
            </form>
          </article>
        )}
        </div>
      </div>
    </section>

    {detailOpen && (
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/45 p-0 sm:p-4"
        role="presentation"
        onClick={closeApplicantDetail}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="applicant-detail-title"
          className="flex h-full w-full max-w-lg flex-col border-l border-surface-border bg-surface-raised shadow-2xl dark:border-surface-dark-border dark:bg-surface-dark-raised sm:max-w-xl sm:rounded-l-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-surface-border px-4 py-3 dark:border-surface-dark-border">
            <h3 id="applicant-detail-title" className="text-lg font-semibold text-ink dark:text-ink-dark">
              {detailId != null ? `Application #${detailId}` : "Application"}
            </h3>
            <button
              type="button"
              className={buttonGhostClass}
              onClick={closeApplicantDetail}
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {detailLoading && <p className="text-sm text-ink-muted dark:text-ink-dark-muted">Loading application…</p>}
            {!detailLoading && appDetail && (
              <>
                <div>
                  <p className="text-sm font-semibold text-ink dark:text-ink-dark">{appDetail.candidate_name}</p>
                  <p className="text-xs text-ink-muted dark:text-ink-dark-muted">{appDetail.candidate_email}</p>
                  <p className="mt-2 text-sm text-ink dark:text-ink-dark">{appDetail.job_title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={appDetail.status} />
                    <select
                      className={`${inputClass} w-auto min-w-[9rem]`}
                      value={appDetail.status}
                      onChange={(e) => updateApplicationStatus(appDetail.application_id, e.target.value)}
                      disabled={loading.status[appDetail.application_id]}
                    >
                      {RECRUITER_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-surface-border pt-4 dark:border-surface-dark-border">
                  {appDetail.resume?.id != null && (
                    <button
                      type="button"
                      className="rounded-lg border border-accent bg-surface-raised px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent-light dark:bg-surface-dark-raised"
                      onClick={() =>
                        downloadAuthenticatedBlob(
                          `/applications/recruiter/${appDetail.application_id}/resume-file`,
                          token,
                          appDetail.resume?.file_name || "resume",
                        ).catch((err) => setError(err.message))
                      }
                    >
                      Download resume file
                    </button>
                  )}
                  {appDetail.generated_cv?.has_pdf && (
                    <button
                      type="button"
                      className="rounded-lg border border-accent bg-surface-raised px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent-light dark:bg-surface-dark-raised"
                      onClick={() =>
                        downloadAuthenticatedBlob(
                          `/applications/recruiter/${appDetail.application_id}/cv-download?export_format=pdf`,
                          token,
                          "cv.pdf",
                        ).catch((err) => setError(err.message))
                      }
                    >
                      Download CV (PDF)
                    </button>
                  )}
                  {appDetail.generated_cv?.has_docx && (
                    <button
                      type="button"
                      className="rounded-lg border border-accent bg-surface-raised px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent-light dark:bg-surface-dark-raised"
                      onClick={() =>
                        downloadAuthenticatedBlob(
                          `/applications/recruiter/${appDetail.application_id}/cv-download?export_format=docx`,
                          token,
                          "cv.docx",
                        ).catch((err) => setError(err.message))
                      }
                    >
                      Download CV (DOCX)
                    </button>
                  )}
                </div>
                {appDetail.cover_letter?.content != null && (
                  <div>
                    <h4 className="text-sm font-semibold text-ink dark:text-ink-dark">Cover letter</h4>
                    <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-surface-border bg-surface-subtle p-3 text-sm whitespace-pre-wrap dark:border-surface-dark-border dark:bg-surface-dark-subtle">
                      {appDetail.cover_letter.content}
                    </div>
                  </div>
                )}
                {appDetail.generated_cv?.cv_json && (
                  <div>
                    <h4 className="text-sm font-semibold text-ink dark:text-ink-dark">
                      CV preview{appDetail.generated_cv.title ? ` — ${appDetail.generated_cv.title}` : ""}
                    </h4>
                    <div className="mt-2 max-h-[min(60vh,28rem)] overflow-y-auto">
                      <RecruiterStructuredCvPreview cvJson={appDetail.generated_cv.cv_json} />
                    </div>
                  </div>
                )}
                {appDetail.resume?.parsed_data && (
                  <div>
                    <h4 className="text-sm font-semibold text-ink dark:text-ink-dark">Parsed resume snapshot</h4>
                    <p className="mt-1 text-sm text-ink dark:text-ink-dark">
                      {appDetail.resume.parsed_data?.summary || appDetail.resume.parsed_data?.name || "Parsed fields available in export."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}