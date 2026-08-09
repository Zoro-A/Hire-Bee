import { Link } from "react-router-dom"
import { PiBriefcase, PiBuildings, PiEnvelopeSimple, PiUsersThree } from "react-icons/pi"
import { cardClass } from "@/styles/uiClasses.js"
import { Metric } from "@/components/Metric.jsx"
import { Badge } from "@/components/ui/badge.jsx"
import { EmptyState } from "@/components/feedback/EmptyState.jsx"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { useAdminData } from "../AdminDataContext.jsx"

function emailStatusVariant(status) {
  const s = (status || "").toLowerCase()
  if (s.startsWith("sent")) return "default"
  if (s.startsWith("failed")) return "destructive"
  return "secondary"
}

const ROLE_LABELS = {
  job_seeker: "Job seekers",
  recruiter: "Recruiters",
  admin: "Admins",
}

export function AdminOverviewPage() {
  const { users, recruiters, jobs, emails } = useAdminData()

  const roleCounts = users.reduce((acc, u) => {
    const role = u.role || "unknown"
    acc[role] = (acc[role] || 0) + 1
    return acc
  }, {})

  const recentEmails = [...emails]
    .sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0))
    .slice(0, 5)

  return (
    <section className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      <PageHeader title="Overview" />
      <div className="grid gap-4 md:grid-cols-4">
        <Link to="/app/admin/users" className="press block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <Metric label="Users" value={users.length} Icon={PiUsersThree} />
        </Link>
        <Link to="/app/admin/recruiters" className="press block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <Metric label="Recruiters" value={recruiters.length} Icon={PiBuildings} />
        </Link>
        <Link to="/app/admin/jobs" className="press block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <Metric label="Jobs" value={jobs.length} Icon={PiBriefcase} />
        </Link>
        <Link to="/app/admin/emails" className="press block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <Metric label="Emails logged" value={emails.length} Icon={PiEnvelopeSimple} />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className={cardClass}>
          <h2 className="mb-3 font-semibold text-ink dark:text-ink-dark">Users by role</h2>
          {users.length === 0 ? (
            <EmptyState title="No users yet." />
          ) : (
            <ul className="space-y-2">
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <li key={role} className="flex items-center justify-between rounded-xl border border-surface-border px-3 py-2 text-sm dark:border-surface-dark-border">
                  <span className="text-ink-muted dark:text-ink-dark-muted">{label}</span>
                  <span className="tabular font-semibold text-ink dark:text-ink-dark">{roleCounts[role] || 0}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={cardClass}>
          <h2 className="mb-3 font-semibold text-ink dark:text-ink-dark">Recent email activity</h2>
          {recentEmails.length === 0 ? (
            <EmptyState title="No email activity yet." />
          ) : (
            <ul className="space-y-2">
              {recentEmails.map((email) => (
                <li key={email.id} className="flex items-center justify-between gap-3 rounded-xl border border-surface-border px-3 py-2 text-sm dark:border-surface-dark-border">
                  <div className="min-w-0">
                    <p className="truncate text-ink dark:text-ink-dark">{email.subject}</p>
                    <p className="truncate text-xs text-ink-muted dark:text-ink-dark-muted">{email.recipient}</p>
                  </div>
                  <Badge variant={emailStatusVariant(email.status)} className="shrink-0">
                    {email.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  )
}
