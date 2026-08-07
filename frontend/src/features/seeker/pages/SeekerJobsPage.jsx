import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { cardClass, inputClass } from "@/styles/uiClasses.js"
import { useSeekerData } from "../SeekerDataContext.jsx"
import { JobListItem } from "../components/JobListItem.jsx"
import { QuickApplyPanel } from "../components/QuickApplyPanel.jsx"

export function SeekerJobsPage() {
  const {
    filteredJobs,
    matchByJobId,
    jobQuery,
    setJobQuery,
    selectedJobId,
    setSelectedJobId,
    setApplyForm,
    selectedJob,
  } = useSeekerData()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const jobParam = searchParams.get("job")
    if (jobParam) {
      setSelectedJobId(jobParam)
      setApplyForm((prev) => ({ ...prev, job_id: jobParam }))
    }
  }, [searchParams, setSelectedJobId, setApplyForm])

  return (
    <section className="min-h-0 flex-1 overflow-y-auto pr-1">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <article className={cardClass}>
          <h3 className="mb-2 text-2xl font-semibold">Job Recommendations</h3>
          <p className="mb-3 text-sm text-ink-muted dark:text-ink-dark-muted">AI-powered matches based on your profile.</p>
          <input className={inputClass} placeholder="Search by job title, company, or keywords..." value={jobQuery} onChange={(e) => setJobQuery(e.target.value)} />
          <div className="mt-4 grid gap-3">
            {filteredJobs.map((job) => (
              <JobListItem
                key={job.id}
                job={job}
                match={matchByJobId.get(job.id)}
                isSelected={String(job.id) === String(selectedJobId)}
                onSelect={() => {
                  setSelectedJobId(String(job.id))
                  setApplyForm((prev) => ({ ...prev, job_id: String(job.id) }))
                }}
              />
            ))}
          </div>
        </article>
        <article className={cardClass}>
          <h3 className="mb-3 text-2xl font-semibold">{selectedJob?.title || "Select a job"}</h3>
          {selectedJob ? (
            <>
              <p className="text-sm text-ink-muted dark:text-ink-dark-muted">{selectedJob.location || "Remote"} • {selectedJob.recruiter_email}</p>
              <h4 className="mt-4 font-semibold">About the role</h4>
              <p className="mt-1 text-sm whitespace-pre-line">{selectedJob.description}</p>
              <QuickApplyPanel job={selectedJob} />
            </>
          ) : (
            <p className="text-sm text-ink-muted dark:text-ink-dark-muted">Pick a job from the list to view full details and quick apply panel.</p>
          )}
        </article>
      </div>
    </section>
  )
}
