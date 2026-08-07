import { PiCheck } from "react-icons/pi"
import { RolePicker } from "@/components/landing/RolePicker.jsx"

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
  return (
    <div className="space-y-8">
      {/* Compact header */}
      <div className="space-y-2 text-center">
        <span className="inline-flex rounded-full border border-brand bg-brand-soft px-3 py-1 text-xs font-semibold tracking-wider text-brand-on-soft">
          AI-Powered Recruitment Platform
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-ink dark:text-ink-dark">
          Run hiring from first resume to final offer.
        </h1>
        <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
          Select your role below to get started
        </p>
      </div>

      {/* Role selection — asymmetric: one featured card + two compact */}
      <RolePicker roles={roles} />

      {/* Platform features — compact secondary */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint">
          What&apos;s included
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ label, desc }) => (
            <div key={label} className="flex items-start gap-2.5 rounded-xl border border-surface-border bg-surface-raised p-3 dark:border-surface-dark-border dark:bg-surface-dark-raised">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand-on-soft">
                <PiCheck className="size-3" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink dark:text-ink-dark">{label}</p>
                <p className="text-[11px] leading-snug text-ink-muted dark:text-ink-dark-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}