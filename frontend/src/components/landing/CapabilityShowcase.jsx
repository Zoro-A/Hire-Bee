import { useRef } from "react"
import { PiGraph, PiChatsCircle, PiFileMagnifyingGlass } from "react-icons/pi"
import { useScrollReveal } from "@/hooks/useScrollReveal.js"
import { cn } from "@/lib/utils"

// Bento: one wide lead card on top, two half-width cards below. Deliberately
// not a third equal-column grid (FeatureGrid already owns that pattern on
// this page) and not RolePicker's tall-left/stacked-right split either — a
// third distinct layout family, still asymmetric, still zero amber.
const CAPABILITIES = [
  {
    id: "semantic-matching",
    Icon: PiGraph,
    title: "Semantic matching, not keyword search",
    desc: "BGE embeddings and a Qdrant vector index compare what a resume and a job description actually mean, not just which words they share, so a “backend engineer” resume surfaces for a “software engineer, backend” listing even without an exact keyword match.",
    lead: true,
  },
  {
    id: "conversational-cv",
    Icon: PiChatsCircle,
    title: "A CV built through conversation",
    desc: "A fine-tuned chat model interviews candidates conversationally and assembles an ATS-ready CV from the dialogue, no blank-form staring required.",
  },
  {
    id: "resume-parsing",
    Icon: PiFileMagnifyingGlass,
    title: "Resume parsing that actually understands resumes",
    desc: "spaCy named-entity recognition and regex extraction pull structured skills, education, and experience out of any resume format, with an OpenAI fallback for the edge cases rule-based parsing misses.",
  },
]

export function CapabilityShowcase() {
  const scopeRef = useRef(null)
  useScrollReveal(scopeRef, { y: 18, stagger: 0.08 })

  const [lead, ...rest] = CAPABILITIES

  return (
    <section ref={scopeRef}>
      <h2 className="mb-6 max-w-2xl font-display text-xl font-semibold text-ink">
        Built on real matching, not keyword search
      </h2>
      <div className="grid gap-4">
        <CapabilityCard capability={lead} className="sm:flex-row sm:items-start sm:gap-6 sm:p-7" />
        <div className="grid gap-4 sm:grid-cols-2">
          {rest.map((capability) => (
            <CapabilityCard key={capability.id} capability={capability} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CapabilityCard({ capability, className }) {
  const { Icon, title, desc } = capability

  return (
    <div
      data-reveal
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-surface-border bg-surface-raised p-5 opacity-0",
        className,
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-subtle text-ink-muted">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{desc}</p>
      </div>
    </div>
  )
}
