import { useRef, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { PiList } from "react-icons/pi"
import { cn } from "@/lib/utils"
import { gsap, useGSAP } from "@/lib/gsap"
import { EASE, REDUCED_MOTION_QUERY } from "@/lib/motion"
import { Button } from "@/components/ui/button.jsx"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet.jsx"

function NavLinks({ items, navRef, withIndicator = false, onNavigate }) {
  return (
    <nav aria-label="Section" ref={navRef} className="grid gap-0.5">
      {items.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
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
                data-active-indicator={withIndicator && isActive ? "true" : undefined}
                style={{ transformOrigin: "center" }}
                className={cn(
                  "absolute left-0 h-4 w-[3px] rounded-full bg-brand",
                  isActive ? "opacity-100" : "opacity-0",
                  withIndicator && "transition-opacity duration-150",
                )}
              />
              <Icon className={cn("size-[18px] shrink-0", isActive && "text-brand")} aria-hidden="true" />
              <span className="truncate">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function DashboardSidebar({ items, roleLabel, roleSublabel }) {
  const navRef = useRef(null)
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  // The one place amber moves in this task: the active-nav indicator bar
  // grows in (scaleY 0 -> 1) whenever the route changes, mirroring the
  // useLocation()-keyed useGSAP pattern from DashboardShell's route-enter
  // transition (Task 6.2). Scoped to the persistent desktop rail only —
  // the mobile drawer's nav copy is a transient, open-then-close surface
  // that doesn't need the same animated flourish.
  useGSAP(
    () => {
      const activeBar = navRef.current?.querySelector('[data-active-indicator="true"]')
      if (!activeBar) return
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(activeBar, { scaleY: 0 }, { scaleY: 1, duration: 0.18, ease: EASE.out })
      })
      mm.add(REDUCED_MOTION_QUERY, () => {
        gsap.set(activeBar, { scaleY: 1 })
      })
      return () => mm.revert()
    },
    { scope: navRef, dependencies: [pathname] },
  )

  return (
    <>
      {/* Mobile: compact bar + off-canvas drawer, replaces the old
          always-visible height-capped stack that ate ~40vh before content. */}
      <div className="glass-panel flex shrink-0 items-center justify-between rounded-2xl p-3 lg:hidden">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">HireBee</p>
          <p className="truncate font-display text-base font-semibold text-ink">{roleLabel}</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <PiList className="size-4" aria-hidden="true" />
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 gap-0 p-4">
            <SheetHeader className="p-0 pb-3">
              <SheetTitle className="font-display">{roleLabel}</SheetTitle>
              {roleSublabel ? <p className="truncate text-xs text-ink-faint">{roleSublabel}</p> : null}
            </SheetHeader>
            <NavLinks items={items} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: persistent rail */}
      <aside className="glass-panel hidden shrink-0 flex-col overflow-y-auto rounded-2xl p-4 lg:flex lg:h-full lg:max-h-none lg:min-h-0 lg:w-[230px]">
        <div className="border-b border-surface-border pb-4">
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">HireBee</p>
          <p className="mt-1 font-display text-lg font-semibold text-ink">{roleLabel}</p>
          {roleSublabel ? <p className="mt-0.5 truncate text-xs text-ink-faint">{roleSublabel}</p> : null}
        </div>
        <div className="mt-4">
          <NavLinks items={items} navRef={navRef} withIndicator />
        </div>
      </aside>
    </>
  )
}
