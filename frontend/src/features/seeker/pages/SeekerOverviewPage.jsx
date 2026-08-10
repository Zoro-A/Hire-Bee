import { Link } from "react-router-dom"
import {
  PiFileText,
  PiListChecks,
  PiCalendarCheck,
  PiFileArrowUp,
  PiNotePencil,
  PiMagnifyingGlass,
  PiArrowRight,
} from "react-icons/pi"
import { formatJobMatchLabel, getMatchBand } from "@/lib/matching.js"
import { Metric } from "@/components/Metric.jsx"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { useSeekerData } from "../SeekerDataContext.jsx"

export function SeekerOverviewPage() {
  const { resumeInsight, apps, jobsSortedByMatch, matchByJobId } = useSeekerData()
  const resumeScore = Math.min(98, Math.max(52, Math.round((resumeInsight?.parsing_confidence || 0.6) * 100)))

  return (
    <section className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      <PageHeader title="Dashboard" description="Your job search at a glance." />
      <div className="grid gap-4 md:grid-cols-3">
        {/* Metric cards */}
        <Metric
          label="Resume Score"
          value={resumeScore}
          suffix="%"
          Icon={PiFileText} iconBg="bg-brand/15" iconColor="text-brand"
          sub="Based on last upload"
        />
        <Metric
          label="Applications"
          value={apps.length}
          Icon={PiListChecks} iconBg="bg-warn/15" iconColor="text-warn"
          sub={`${apps.filter((a) => a.status === "applied").length} awaiting review`}
        />
        <Metric
          label="Interviews"
          value={apps.filter((a) => a.status === "interview").length}
          Icon={PiCalendarCheck} iconBg="bg-success/15" iconColor="text-success"
          sub="Scheduled"
        />

        {/* Quick Actions */}
        <article className="md:col-span-3">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-faint">Quick Actions</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { page: "resume", Icon: PiFileArrowUp, iconBg: "bg-brand/15",  iconColor: "text-brand",  title: "Upload Resume",  desc: "Get AI-powered analysis & skill extraction" },
              { page: "cv",     Icon: PiNotePencil,   iconBg: "bg-warn/15",   iconColor: "text-warn",    title: "Generate CV",    desc: "Build an ATS-ready CV through chat" },
              { page: "jobs",   Icon: PiMagnifyingGlass, iconBg: "bg-success/15", iconColor: "text-success", title: "Browse Jobs",    desc: "Explore roles matched to your profile" },
            ].map(({ page, Icon, iconBg, iconColor, title, desc }) => (
              <Link
                key={page}
                to={`/app/seeker/${page}`}
                className="group flex items-center gap-4 rounded-2xl border border-surface-border bg-surface-raised p-4 text-left transition active:scale-[0.97] hover:border-brand hover:shadow-card-hover"
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-transform duration-150 group-hover:scale-110 ${iconBg} ${iconColor}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{title}</p>
                  <p className="text-xs text-ink-muted">{desc}</p>
                </div>
                <span className="shrink-0 text-lg text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
                  <PiArrowRight />
                </span>
              </Link>
            ))}
          </div>
        </article>

        {/* Recommended Jobs */}
        <article className="md:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint">Recommended Jobs</h2>
            <Link
              to="/app/seeker/jobs"
              className="text-xs font-medium text-brand hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {jobsSortedByMatch.slice(0, 4).map((job) => {
              const m = matchByJobId.get(job.id)
              const band = getMatchBand(m?.match_percentage)
              return (
                <Link
                  key={job.id}
                  to={`/app/seeker/jobs?job=${job.id}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface-raised p-4 text-left transition active:scale-[0.97] hover:border-brand hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{job.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">{job.location || "Remote"}{job.salary ? ` · $${job.salary}` : ""}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${band.chipClass}`}>{formatJobMatchLabel(m)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.required_skills.slice(0, 5).map((skill) => (
                      <span key={skill} className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] text-ink-muted">{skill}</span>
                    ))}
                    {job.required_skills.length > 5 && (
                      <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] text-ink-muted">+{job.required_skills.length - 5} more</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </article>
      </div>
    </section>
  )
}
