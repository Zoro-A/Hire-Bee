import { DataTableShell } from "../components/DataTableShell.jsx"
import { useAdminData } from "../AdminDataContext.jsx"

const columns = [
  { key: "id", header: "ID", className: "font-mono tabular" },
  { key: "company_name", header: "Company" },
  { key: "recruiter_email", header: "Recruiter email" },
  { key: "user_id", header: "User ID", className: "font-mono tabular" },
  { key: "open_roles", header: "Open roles", align: "right", className: "tabular" },
]

export function AdminRecruitersPage() {
  const { recruiters, jobs } = useAdminData()

  const rows = recruiters.map((recruiter) => ({
    ...recruiter,
    open_roles: jobs.filter(
      (job) => job.recruiter_email?.toLowerCase() === recruiter.recruiter_email?.toLowerCase(),
    ).length,
  }))

  function renderCell(recruiter, key) {
    switch (key) {
      case "id":
        return recruiter.id
      case "company_name":
        return recruiter.company_name || "—"
      case "recruiter_email":
        return recruiter.recruiter_email
      case "user_id":
        return recruiter.user_id
      case "open_roles":
        return recruiter.open_roles
      default:
        return null
    }
  }

  return (
    <DataTableShell
      caption="Recruiters"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      renderCell={renderCell}
      searchKeys={["company_name", "recruiter_email"]}
      emptyLabel="No recruiters found."
    />
  )
}
