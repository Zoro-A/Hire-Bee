import { PiListChecks } from "react-icons/pi"
import { Metric } from "@/components/Metric.jsx"
import { StatusBadge } from "@/components/StatusBadge.jsx"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { EmptyState } from "@/components/feedback/EmptyState.jsx"
import { Card } from "@/components/ui/card.jsx"
import { useSeekerData } from "../SeekerDataContext.jsx"

export function SeekerApplicationsPage() {
  const { apps, jobs } = useSeekerData()

  return (
    <section className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      <PageHeader title="My Applications" />
      <div className="grid gap-6">
        <Card className="block gap-0 p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Total Applications" value={apps.length} />
            <Metric label="Under Review" value={apps.filter((a) => a.status === "applied" || a.status === "shortlisted").length} />
            <Metric label="Interviews" value={apps.filter((a) => a.status === "interview").length} />
          </div>
        </Card>

        <Card className="block gap-0 p-5">
          <h2 className="mb-3 font-display font-semibold text-ink">Application Status Tracking</h2>
          {apps.length === 0 ? (
            <EmptyState
              icon={<PiListChecks aria-hidden="true" />}
              title="No applications yet"
              description="Apply to a job from the Jobs tab to see it tracked here."
            />
          ) : (
            <div className="grid gap-2 text-sm">
              {apps.map((app) => {
                const jobTitle = jobs.find((job) => job.id === app.job_id)?.title ?? `Job #${app.job_id}`
                return (
                  <div key={app.id} className="rounded-xl border border-surface-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{jobTitle}</p>
                        <p className="text-xs">Application #{app.id}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </section>
  )
}
