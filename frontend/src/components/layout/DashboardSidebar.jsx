import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"

export function DashboardSidebar({ items, roleLabel, roleSublabel }) {
  return (
    <aside className="glass-panel flex max-h-[min(40vh,320px)] shrink-0 flex-col overflow-y-auto rounded-2xl p-4 lg:h-full lg:max-h-none lg:min-h-0 lg:w-[230px]">
      <div className="border-b border-surface-border pb-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">HireBee</p>
        <p className="mt-1 font-display text-lg font-semibold text-ink">{roleLabel}</p>
        {roleSublabel ? <p className="mt-0.5 truncate text-xs text-ink-faint">{roleSublabel}</p> : null}
      </div>
      <nav aria-label="Section" className="mt-4 grid gap-0.5">
        {items.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                "focus-visible:outline-none",
                isActive
                  ? "bg-surface-subtle font-medium text-ink"
                  : "text-ink-muted hover:bg-surface-subtle/60 hover:text-ink",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 h-4 w-[3px] rounded-full transition-opacity duration-150",
                    isActive ? "bg-brand opacity-100" : "opacity-0",
                  )}
                />
                <Icon className={cn("size-[18px] shrink-0", isActive && "text-brand")} aria-hidden="true" />
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
