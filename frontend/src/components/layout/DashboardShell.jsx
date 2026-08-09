import { useRef } from "react"
import { useLocation } from "react-router-dom"
import { gsap, useGSAP } from "@/lib/gsap"
import { DUR, EASE, REDUCED_MOTION_QUERY } from "@/lib/motion"

export function DashboardShell({ sidebar, children }) {
  const mainRef = useRef(null)
  const { pathname } = useLocation()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          mainRef.current,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: DUR.fast, ease: EASE.out },
        )
      })
      mm.add(REDUCED_MOTION_QUERY, () => {
        gsap.set(mainRef.current, { opacity: 1, y: 0 })
      })
      return () => mm.revert()
    },
    { dependencies: [pathname] },
  )

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 lg:flex-row">
      {sidebar}
      <main id="main" ref={mainRef} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
