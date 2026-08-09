import { useRef } from "react"
import { PiShieldCheck, PiFileMagnifyingGlass, PiChatsCircle, PiGraph, PiEnvelopeSimple, PiCalendarCheck } from "react-icons/pi"
import { useScrollReveal } from "@/hooks/useScrollReveal.js"

// Mechanic-specific icon per feature, keyed by label. No amber here — this
// section informs, it doesn't compete with the role picker's CTA for
// visual priority (amber restraint, Global Constraint 6).
const FEATURE_ICONS = {
  "Auth & RBAC": PiShieldCheck,
  "Resume Parsing": PiFileMagnifyingGlass,
  "Conversational CV": PiChatsCircle,
  "Semantic Matching": PiGraph,
  "Cover Letters": PiEnvelopeSimple,
  "Interview Scheduling": PiCalendarCheck,
}

export function FeatureGrid({ features }) {
  const scopeRef = useRef(null)
  useScrollReveal(scopeRef, { selector: "[data-reveal-feature]", y: 12, stagger: 0.04 })

  return (
    <div ref={scopeRef} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {features.map(({ label, desc }) => {
        const Icon = FEATURE_ICONS[label]
        return (
          <div key={label} data-reveal-feature className="flex items-start gap-3 rounded-xl border border-surface-border bg-surface-raised p-4 opacity-0">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-ink-muted">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="mt-0.5 text-xs leading-snug text-ink-muted">{desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
