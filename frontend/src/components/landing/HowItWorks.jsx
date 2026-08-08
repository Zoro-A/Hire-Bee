import { useRef } from "react"
import { useScrollReveal } from "@/hooks/useScrollReveal.js"

// Two real sequential processes (numbering is earned here, unlike decorative
// step chips elsewhere) — a two-column list, deliberately not another
// bordered-box grid so this section reads as a different layout family from
// RolePicker/FeatureGrid. Neutral step badges only; amber restraint holds.
const TRACKS = [
  {
    id: "job-seekers",
    label: "For job seekers",
    steps: [
      {
        title: "Build your CV",
        desc: "Upload a resume or build one conversationally with the AI CV assistant.",
      },
      {
        title: "Get matched",
        desc: "Semantic matching scores you against every open role, not just keyword hits.",
      },
      {
        title: "Apply with confidence",
        desc: "Generate a tailored cover letter and track every application in one place.",
      },
    ],
  },
  {
    id: "recruiters",
    label: "For recruiters",
    steps: [
      {
        title: "Post a role",
        desc: "List the required skills once; HireBee handles matching automatically.",
      },
      {
        title: "Review scored candidates",
        desc: "See every applicant ranked by semantic match, not resume keyword luck.",
      },
      {
        title: "Schedule and hire",
        desc: "Move straight to interview scheduling with built-in email automation.",
      },
    ],
  },
]

export function HowItWorks() {
  const scopeRef = useRef(null)
  useScrollReveal(scopeRef, { y: 12, stagger: 0.08 })

  return (
    <section ref={scopeRef}>
      <h2 className="mb-6 font-display text-xl font-semibold text-ink">How it works</h2>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {TRACKS.map((track) => (
          <div key={track.id}>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-ink-faint">
              {track.label}
            </h3>
            <ol className="space-y-6">
              {track.steps.map((step, index) => (
                <li key={step.title} data-reveal className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-sm font-semibold text-ink-muted"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{step.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}
