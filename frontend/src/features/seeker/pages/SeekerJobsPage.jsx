import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { cardClass, inputClass } from "@/styles/uiClasses.js"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
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
      <PageHeader title="Jobs" description="AI-powered matches based on your profile." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <article className={cardClass}>
          <h2 className="mb-2 text-2xl font-semibold">Job Recommendations</h2>
          <p className="mb-3 text-sm text-ink-muted">AI-powered matches based on your profile.</p>
          <label className="sr-only" htmlFor="job-search">
            Search by job title, company, or keywords
          </label>
          <input
            id="job-search"
            className={inputClass}
            placeholder="Search by job title, company, or keywords..."
            value={jobQuery}
            onChange={(e) => setJobQuery(e.target.value)}
          />
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
          <h2 className="mb-3 text-2xl font-semibold">{selectedJob?.title || "Select a job"}</h2>
          {selectedJob ? (
            <>
              <p className="text-sm text-ink-muted">{selectedJob.location || "Remote"} • {selectedJob.recruiter_email}</p>
              <h3 className="mt-4 font-semibold">About the role</h3>
              <p className="mt-1 text-sm whitespace-pre-line">{selectedJob.description}</p>
              <QuickApplyPanel job={selectedJob} />
            </>
          ) : (
            <p className="text-sm text-ink-muted">Pick a job from the list to view full details and quick apply panel.</p>
          )}
        </article>
      </div>
    </section>
  )
}
