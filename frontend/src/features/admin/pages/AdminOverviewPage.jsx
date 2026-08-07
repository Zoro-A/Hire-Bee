import { Link } from "react-router-dom"
import { PiBriefcase, PiBuildings, PiEnvelopeSimple, PiUsersThree } from "react-icons/pi"
import { cardClass } from "@/styles/uiClasses.js"
import { Metric } from "@/components/Metric.jsx"
import { Badge } from "@/components/ui/badge.jsx"
import { EmptyState } from "@/components/feedback/EmptyState.jsx"
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
      <div className="grid gap-4 md:grid-cols-4">
        <Link to="/app/admin/users" className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <Metric label="Users" value={<span className="tabular">{users.length}</span>} Icon={PiUsersThree} />
        </Link>
        <Link to="/app/admin/recruiters" className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <Metric label="Recruiters" value={<span className="tabular">{recruiters.length}</span>} Icon={PiBuildings} />
        </Link>
        <Link to="/app/admin/jobs" className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <Metric label="Jobs" value={<span className="tabular">{jobs.length}</span>} Icon={PiBriefcase} />
        </Link>
        <Link to="/app/admin/emails" className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <Metric label="Emails logged" value={<span className="tabular">{emails.length}</span>} Icon={PiEnvelopeSimple} />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className={cardClass}>
          <h3 className="mb-3 font-semibold text-ink dark:text-ink-dark">Users by role</h3>
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
          <h3 className="mb-3 font-semibold text-ink dark:text-ink-dark">Recent email activity</h3>
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
