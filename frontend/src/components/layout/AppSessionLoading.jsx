export function AppSessionLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-[100dvh] flex-col items-center justify-center gap-2 bg-surface text-ink"
    >
      <p className="text-sm font-medium text-ink-muted">Loading your session…</p>
      <p className="text-xs text-ink-faint">Please wait</p>
    </div>
  )
}
