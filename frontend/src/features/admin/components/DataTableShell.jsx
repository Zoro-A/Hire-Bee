import { useId, useMemo, useState } from "react"
import { Input } from "@/components/ui/input.jsx"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.jsx"
import { EmptyState } from "@/components/feedback/EmptyState.jsx"
import { cn } from "@/lib/utils"

/**
 * Reusable admin table: labelled search box that filters rows across
 * `searchKeys`, a shadcn `Table` with an sr-only caption (so the table has
 * an accessible name), a live row-count region, and an `EmptyState` when
 * the filter matches nothing.
 */
export function DataTableShell({
  caption,
  columns,
  rows,
  getRowKey,
  renderCell,
  searchKeys = [],
  emptyLabel = "No results found.",
}) {
  const [query, setQuery] = useState("")
  const searchId = useId()

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) =>
      searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(needle)),
    )
  }, [rows, query, searchKeys])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="max-w-xs">
        <label htmlFor={searchId} className="sr-only">
          Search
        </label>
        <Input
          id={searchId}
          type="search"
          placeholder="Search…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div role="status" className="text-xs text-ink-muted">
        Showing {filteredRows.length} of {rows.length} row{rows.length === 1 ? "" : "s"}
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState title={emptyLabel} />
      ) : (
        <Table>
          <TableCaption className="sr-only">{caption}</TableCaption>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(column.align === "right" && "text-right", column.className)}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={getRowKey(row)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(column.align === "right" && "text-right", column.className)}
                  >
                    {renderCell(row, column.key)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
