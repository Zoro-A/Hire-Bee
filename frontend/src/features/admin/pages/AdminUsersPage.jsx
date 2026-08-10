import { Badge } from "@/components/ui/badge.jsx"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { DataTableShell } from "../components/DataTableShell.jsx"
import { useAdminData } from "../AdminDataContext.jsx"

const ROLE_VARIANTS = {
  job_seeker: "secondary",
  recruiter: "outline",
  admin: "default",
}

const columns = [
  { key: "id", header: "ID", className: "font-mono tabular" },
  { key: "full_name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "role", header: "Role" },
  { key: "is_active", header: "Status" },
]

function renderCell(user, key) {
  switch (key) {
    case "id":
      return user.id
    case "full_name":
      return user.full_name || "—"
    case "email":
      return user.email
    case "role":
      return <Badge variant={ROLE_VARIANTS[user.role] ?? "outline"}>{user.role}</Badge>
    case "is_active":
      return user.is_active ? (
        <Badge variant="success">Active</Badge>
      ) : (
        <Badge variant="secondary">Inactive</Badge>
      )
    default:
      return null
  }
}

export function AdminUsersPage() {
  const { users } = useAdminData()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
      <PageHeader title="Users" />
      <DataTableShell
        caption="Platform users"
        columns={columns}
        rows={users}
        getRowKey={(row) => row.id}
        renderCell={renderCell}
        searchKeys={["full_name", "email", "role"]}
        emptyLabel="No users found."
      />
    </div>
  )
}
