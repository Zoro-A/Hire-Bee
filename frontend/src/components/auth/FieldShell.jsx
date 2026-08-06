export function FieldShell({ children }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-subtle px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-1 dark:border-surface-dark-border dark:bg-surface-dark-subtle">
      {children}
    </div>
  )
}
