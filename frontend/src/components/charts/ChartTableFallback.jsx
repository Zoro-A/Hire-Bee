import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.jsx"
import { cn } from "@/lib/utils"

/**
 * Non-visual, fully-equivalent alternative to a chart: a native
 * <details><summary> disclosure around a real <table>. Every chart in this
 * app ships one of these underneath it (dataviz skill, step "table
 * fallback") so screen-reader users, keyboard users, and anyone who wants
 * exact numbers (copy/paste, printing) has a complete substitute — not a
 * "text description," the same data.
 *
 * `columns`: [{ key, header, align? }]
 * `rows`: array of plain objects keyed by `column.key`
 */
export function ChartTableFallback({ caption, columns, rows }) {
  return (
    <details className="group mt-2">
      <summary className="cursor-pointer select-none text-xs font-medium text-ink-muted underline decoration-dotted underline-offset-2 hover:text-ink dark:text-ink-dark-muted dark:hover:text-ink-dark">
        View as table
      </summary>
      <div className="mt-2">
        <Table>
          <TableCaption className="sr-only">{caption}</TableCaption>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={cn(column.align === "right" && "text-right")}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.key ?? index}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={cn(column.align === "right" && "tabular text-right")}>
                    {row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </details>
  )
}
