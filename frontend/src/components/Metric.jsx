import { useRef, useState } from "react"
import { gsap, useGSAP } from "@/lib/gsap"
import { DUR, EASE, REDUCED_MOTION_QUERY } from "@/lib/motion"
import { cardClass } from "../styles/uiClasses.js"

function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.(REDUCED_MOTION_QUERY).matches
}

export function Metric({ label, value, Icon, iconBg = "bg-brand/15", iconColor = "text-brand", sub, suffix = "" }) {
  const isNumeric = typeof value === "number" && Number.isFinite(value)
  // Non-null only while the one-time mount count-up tween is actively driving
  // the number; null means "just render the `value` prop directly" — which
  // covers reduced motion, non-numeric values, and every render after the
  // tween completes (so a later refresh() just reflects the new number with
  // no replayed animation).
  const [tweenedValue, setTweenedValue] = useState(() => (isNumeric && !prefersReducedMotion() ? 0 : null))
  const hasAnimatedRef = useRef(false)

  useGSAP(
    () => {
      if (!isNumeric || hasAnimatedRef.current || prefersReducedMotion()) return
      hasAnimatedRef.current = true

      const counter = { v: 0 }
      gsap.to(counter, {
        v: value,
        duration: DUR.slow,
        ease: EASE.soft,
        snap: { v: 1 },
        onUpdate: () => setTweenedValue(counter.v),
        onComplete: () => setTweenedValue(null),
      })

      return () => setTweenedValue(null)
    },
    { dependencies: [value] },
  )

  const displayNumber = tweenedValue !== null ? tweenedValue : value

  return (
    <div className={`${cardClass} flex items-start gap-4 transition-transform duration-150 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0`}>
      {Icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${iconBg} ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">{label}</p>
        <p className="mt-0.5 text-3xl font-bold tracking-tight text-ink">
          {isNumeric ? (
            <span className="tabular">
              {displayNumber}
              {suffix}
            </span>
          ) : (
            value
          )}
        </p>
        {sub && <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>}
      </div>
    </div>
  )
}
