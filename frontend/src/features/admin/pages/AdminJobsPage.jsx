import { Badge } from "@/components/ui/badge.jsx"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { DataTableShell } from "../components/DataTableShell.jsx"
import { useAdminData } from "../AdminDataContext.jsx"

const SKILLS_PREVIEW_COUNT = 3

const columns = [
  { key: "id", header: "ID", className: "font-mono tabular" },
  { key: "title", header: "Title" },
  { key: "location", header: "Location" },
  { key: "salary", header: "Salary", align: "right", className: "tabular" },
  { key: "recruiter_email", header: "Recruiter email" },
  { key: "required_skills", header: "Required skills" },
]

function renderCell(job, key) {
  switch (key) {
    case "id":
      return job.id
    case "title":
      return job.title
    case "location":
      return job.location || "Remote"
    case "salary":
      return job.salary ? Number(job.salary).toLocaleString() : "—"
    case "recruiter_email":
      return job.recruiter_email || "—"
    case "required_skills": {
      const skills = job.required_skills ?? []
      const shown = skills.slice(0, SKILLS_PREVIEW_COUNT)
      const remaining = skills.length - shown.length
      if (skills.length === 0) return "—"
      return (
        <div className="flex flex-wrap gap-1">
          {shown.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
          {remaining > 0 && <Badge variant="outline">+{remaining} more</Badge>}
        </div>
      )
    }
    default:
      return null
  }
}

export function AdminJobsPage() {
  const { jobs } = useAdminData()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
      <PageHeader title="Jobs" />
      <DataTableShell
        caption="Posted jobs"
        columns={columns}
        rows={jobs}
        getRowKey={(row) => row.id}
        renderCell={renderCell}
        searchKeys={["title", "location", "recruiter_email"]}
        emptyLabel="No jobs found."
      />
    </div>
  )
}
