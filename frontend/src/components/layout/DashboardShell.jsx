export function DashboardShell({ sidebar, children }) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 lg:flex-row">
      {sidebar}
      <main id="main" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
