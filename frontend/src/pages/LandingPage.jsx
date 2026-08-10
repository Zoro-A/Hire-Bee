import { useRef } from "react"
import { Link } from "react-router-dom"
import { RolePicker } from "@/components/landing/RolePicker.jsx"
import { FeatureGrid } from "@/components/landing/FeatureGrid.jsx"
import { HowItWorks } from "@/components/landing/HowItWorks.jsx"
import { CapabilityShowcase } from "@/components/landing/CapabilityShowcase.jsx"
import { Button } from "@/components/ui/button"
import { useScrollReveal } from "@/hooks/useScrollReveal.js"

const roles = [
  {
    id: "job_seeker",
    eyebrow: "Job Seeker",
    headline: "Land your next role",
    description: "Build an ATS-ready CV through conversation, get matched to jobs semantically, and generate cover letters in one click.",
    perks: ["Conversational CV Builder", "Semantic Job Matching", "Cover Letter Generator"],
    cta: "Get Started",
  },
  {
    id: "recruiter",
    eyebrow: "Recruiter",
    headline: "Hire the right people",
    description: "Parse resumes automatically, score candidates, and manage the full pipeline from application to offer.",
    perks: ["Resume Parsing & Scoring", "Candidate Pipeline", "Interview Scheduling"],
    cta: "Start Hiring",
  },
  {
    id: "admin",
    eyebrow: "Admin",
    headline: "Manage the platform",
    description: "Oversee all users, recruiters, and job listings from a unified dashboard with full analytics.",
    perks: ["User Management", "Recruiter Oversight", "Platform Analytics"],
    cta: "Admin Access",
  },
]

const features = [
  { label: "Auth & RBAC", desc: "Secure JWT auth with Google OAuth and role-based access" },
  { label: "Resume Parsing", desc: "spaCy NER + regex extraction with OpenAI fallback" },
  { label: "Conversational CV", desc: "Fine-tuned chat model builds ATS-ready CVs through dialogue" },
  { label: "Semantic Matching", desc: "BGE embeddings + Qdrant vector search with match scoring" },
  { label: "Cover Letters", desc: "LLM-generated, job-specific cover letters in one click" },
  { label: "Interview Scheduling", desc: "End-to-end from application to offer with email automation" },
]

export function LandingPage() {
  // Scoped to this top section only (not the page root) so its default
  // `[data-reveal]` selector can't also pick up HowItWorks/CapabilityShowcase's
  // own `[data-reveal]` targets further down the tree — each section owns its
  // own useScrollReveal scope, per the established pattern.
  const scope = useRef(null)
  useScrollReveal(scope)

  return (
    <div className="space-y-14">
      {/* TODO(hero): deferred — see docs/superpowers/specs/2026-08-06-hirebee-ui-ux-rework-design.md §9.
          Intentionally a plain top section, not a hero. Do not expand without a new spec. */}
      <section ref={scope} className="border-b border-surface-border py-14 sm:py-20">
        <span data-reveal className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-subtle px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted opacity-0">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
          AI-powered recruitment
        </span>
        <h1 data-reveal className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink opacity-0 sm:text-5xl">
          Run hiring from first resume to final offer.
        </h1>
        <p data-reveal className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted opacity-0">
          Semantic matching between candidates and roles, not keyword search. Pick how you want to start.
        </p>
      </section>

      {/* Role selection — asymmetric: one featured card + two compact */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">Choose how you&apos;ll use HireBee</h2>
        <RolePicker roles={roles} />
      </section>

      {/* Real numbered process per audience — two-column list, not a card grid */}
      <HowItWorks />

      {/* Platform features — informational, zero amber (restraint) */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">What&apos;s included</h2>
        <FeatureGrid features={features} />
      </section>

      {/* Deeper dive on the 3 most distinctive capabilities — asymmetric bento */}
      <CapabilityShowcase />

      {/* Closing CTA — quiet, centered, reuses existing role CTAs verbatim */}
      <section className="border-t border-surface-border py-14 text-center">
        <h2 className="font-display text-2xl font-semibold text-ink">Ready to get started?</h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/register?role=job_seeker">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/register?role=recruiter">Start Hiring</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}