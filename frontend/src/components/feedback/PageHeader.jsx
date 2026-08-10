/**
 * Page-level heading row: title + optional description on the left,
 * optional right-aligned actions (e.g. buttons) on the right.
 */
export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex shrink-0 flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}
