/**
 * Bordered field container shared by the auth pages: a leading icon, a
 * borderless shadcn <Input>, and (for password fields) a trailing visibility
 * toggle button. Centralizes icon sizing/color so callers don't repeat it.
 */
export function FieldShell({ children }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-subtle px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-1 [&>svg:first-child]:size-4 [&>svg:first-child]:shrink-0 [&>svg:first-child]:text-ink-faint">
      {children}
    </div>
  )
}
