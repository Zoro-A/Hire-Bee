import { Badge } from "@/components/ui/badge.jsx"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.jsx"
import { DataTableShell } from "../components/DataTableShell.jsx"
import { useAdminData } from "../AdminDataContext.jsx"

const RENDER_CAP = 200

function statusVariant(status) {
  const s = (status || "").toLowerCase()
  if (s === "sent") return "default"
  if (s === "failed") return "destructive"
  return "secondary"
}

const columns = [
  { key: "status", header: "Status" },
  { key: "recipient", header: "Recipient" },
  { key: "subject", header: "Subject" },
  { key: "provider", header: "Provider" },
  { key: "created_at", header: "Sent", className: "tabular" },
]

function renderCell(email, key) {
  switch (key) {
    case "status":
      return <Badge variant={statusVariant(email.status)}>{email.status}</Badge>
    case "recipient":
      return email.recipient
    case "provider":
      return email.provider || "—"
    case "created_at":
      return email.created_at ? new Date(email.created_at).toLocaleString() : "—"
    case "subject":
      return (
        <Dialog>
          <DialogTrigger className="text-left underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            {email.subject}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{email.subject}</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground">
              To {email.recipient}
              {email.created_at ? ` · ${new Date(email.created_at).toLocaleString()}` : ""}
            </p>
            <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm">{email.body}</pre>
          </DialogContent>
        </Dialog>
      )
    default:
      return null
  }
}

export function AdminEmailsPage() {
  const { emails } = useAdminData()

  const rows = [...emails]
    .sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0))
    .slice(0, RENDER_CAP)

  return (
    <DataTableShell
      caption="Email logs (showing 200 most recent)"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      renderCell={renderCell}
      searchKeys={["recipient", "subject", "status", "provider"]}
      emptyLabel="No email logs found."
    />
  )
}
