import { cardClass } from "@/styles/uiClasses.js"
import { Badge } from "@/components/ui/badge.jsx"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.jsx"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { emailStatusBadgeVariant } from "@/lib/email.js"
import { useRecruiterData } from "../RecruiterDataContext.jsx"

export function RecruiterEmailsPage() {
  const { logs } = useRecruiterData()

  return (
    <section className="min-h-0 flex-1 overflow-y-auto pr-1">
      <PageHeader title="Email logs" />
      <article className={cardClass}>
        <h2 className="mb-1 font-semibold">Email automation</h2>
        <p className="mb-4 text-xs text-ink-muted">Recent platform sends (applications, interviews, password reset).</p>
        <div className="overflow-hidden rounded-xl border border-surface-border">
          <Table className="min-w-[640px]">
            <TableCaption className="sr-only">Recent platform email sends</TableCaption>
            <TableHeader className="bg-surface-subtle">
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase text-ink-muted">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-ink-muted">Recipient</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-ink-muted">Subject</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-ink-muted">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.slice(0, 40).map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant={emailStatusBadgeVariant(log.status)}>{log.status}</Badge>
                  </TableCell>
                  <TableCell className="text-ink-muted">{log.recipient}</TableCell>
                  <TableCell className="whitespace-normal text-ink">{log.subject}</TableCell>
                  <TableCell className="text-xs text-ink-muted">{log.created_at ? new Date(log.created_at).toLocaleString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {logs.length === 0 && <p className="p-4 text-sm text-ink-muted">No email rows yet.</p>}
        </div>
      </article>
    </section>
  )
}
