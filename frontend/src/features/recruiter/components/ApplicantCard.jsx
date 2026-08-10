import { PiStar } from "react-icons/pi"
import { getMatchBand } from "@/lib/matching.js"
import { inputClass, buttonGhostClass } from "@/styles/uiClasses.js"
import { StatusBadge } from "@/components/StatusBadge.jsx"
import { RECRUITER_STATUS_OPTIONS } from "@/constants/recruiter.js"
import { useRecruiterData } from "../RecruiterDataContext.jsx"

export function ApplicantCard({ app }) {
  const { loading, updateApplicationStatus, openApplicantDetail } = useRecruiterData()
  const badge = getMatchBand(app.match_percentage)
  const hasScore = app.match_percentage != null && Number.isFinite(Number(app.match_percentage))
  const statusFieldId = `applicant-status-${app.application_id}`

  return (
    <article className={`rounded-xl border ${badge.borderClass} p-4`}>
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
              <span className="inline-flex items-center gap-1 rounded-full bg-band-high px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                <PiStar className="size-3" aria-hidden="true" />
                Top match
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${badge.textClass}`}>
              <span className={`inline-block h-2 w-2 rounded-full ${badge.dotClass}`} />
              {badge.label}
            </span>
          </div>
          <p className="font-semibold text-ink">{app.candidate_name}</p>
          <p className="text-xs text-ink-muted">{app.candidate_email}</p>
          <p className="mt-1 text-sm text-ink">{app.job_title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={app.status} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="sr-only" htmlFor={statusFieldId}>
            Update status for {app.candidate_name}
          </label>
          <select
            id={statusFieldId}
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
          <button
            type="button"
            className={buttonGhostClass}
            onClick={() => openApplicantDetail(app.application_id)}
          >
            View application
          </button>
        </div>
      </div>
      {(app.matched_skills?.length > 0 || app.missing_skills?.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-4 border-t border-surface-border pt-3 text-xs">
          {app.matched_skills?.length > 0 && (
            <div>
              <span className="font-semibold text-success">Matched</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {app.matched_skills.map((s) => (
                  <span key={s} className="rounded bg-success-bg px-2 py-0.5 text-success">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {app.missing_skills?.length > 0 && (
            <div>
              <span className="font-semibold text-danger">Missing</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {app.missing_skills.map((s) => (
                  <span key={s} className="rounded bg-danger-bg px-2 py-0.5 text-danger">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
