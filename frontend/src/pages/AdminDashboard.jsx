import { useEffect, useState } from "react"
import { apiRequest } from "../lib/api.js"
import { cardClass } from "../styles/uiClasses.js"
import { Metric } from "../components/Metric.jsx"

export function AdminDashboard({ token, user: _user }) {
  const [users, setUsers] = useState([])
  const [recruiters, setRecruiters] = useState([])
  const [jobs, setJobs] = useState([])
  const [emails, setEmails] = useState([])

  useEffect(() => {
    Promise.all([
      apiRequest("/admin/users", {}, token),
      apiRequest("/admin/recruiters", {}, token),
      apiRequest("/jobs", {}, token),
      apiRequest("/emails/logs", {}, token),
    ]).then(([u, r, j, e]) => {
      setUsers(u)
      setRecruiters(r)
      setJobs(j)
      setEmails(e)
    }).catch(() => {})
  }, [token])

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        <h2 className="text-2xl font-semibold text-ink dark:text-ink-dark">Admin Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Users" value={users.length} />
          <Metric label="Recruiters" value={recruiters.length} />
          <Metric label="Jobs" value={jobs.length} />
          <Metric label="Emails Logged" value={emails.length} />
        </div>
        <article className={cardClass}>
          <h3 className="mb-2 font-semibold text-ink dark:text-ink-dark">Users</h3>
          <div className="space-y-1 text-sm text-ink-muted dark:text-ink-dark-muted">
            {users.map((u) => <div key={u.id}>{u.full_name} ({u.role})</div>)}
          </div>
        </article>
        <article className={cardClass}>
          <h3 className="mb-2 font-semibold text-ink dark:text-ink-dark">Recruiters</h3>
          <div className="space-y-1 text-sm text-ink-muted dark:text-ink-dark-muted">
            {recruiters.map((r) => <div key={r.id}>{r.company_name} - {r.recruiter_email}</div>)}
          </div>
        </article>
      </div>
    </section>
  )
}
