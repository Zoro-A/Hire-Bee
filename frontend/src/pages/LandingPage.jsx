import { Link } from "react-router-dom"

const roles = [
  {
    id: "job_seeker",
    title: "Job Seeker",
    icon: "👤",
    iconBg: "bg-brand-soft",
    iconColor: "text-brand-on-soft",
    headline: "Land your next role",
    desc: "Build an ATS-ready CV through conversation, get matched to jobs semantically, and generate cover letters in one click.",
    perks: ["Conversational CV Builder", "Semantic Job Matching", "Cover Letter Generator"],
    cta: "Get Started",
  },
  {
    id: "recruiter",
    title: "Recruiter",
    icon: "🏢",
    iconBg: "bg-warn-bg",
    iconColor: "text-warn",
    headline: "Hire the right people",
    desc: "Parse resumes automatically, score candidates, and manage the full pipeline from application to offer.",
    perks: ["Resume Parsing & Scoring", "Candidate Pipeline", "Interview Scheduling"],
    cta: "Start Hiring",
  },
  {
    id: "admin",
    title: "Admin",
    icon: "⚙️",
    iconBg: "bg-surface-subtle dark:bg-surface-dark-subtle",
    iconColor: "text-ink-muted dark:text-ink-dark-muted",
    headline: "Manage the platform",
    desc: "Oversee all users, recruiters, and job listings from a unified dashboard with full analytics.",
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

      {/* Role selection — all three equal */}
      <div className="grid gap-4 md:grid-cols-3">
        {roles.map(({ id, title, icon, iconBg, iconColor, headline, desc, perks, cta }) => (
          <Link
            key={id}
            to={`/register?role=${id}`}
            className="group flex flex-col rounded-2xl border border-surface-border bg-surface-raised p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand hover:shadow-[0_4px_24px_-4px_rgb(5_150_105_/_0.18)] dark:border-surface-dark-border dark:bg-surface-dark-raised"
          >
            <span className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${iconBg} ${iconColor}`}>
              {icon}
            </span>
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-ink-faint dark:text-ink-dark-faint">
              {title}
            </p>
            <h2 className="mb-2 text-lg font-bold text-ink dark:text-ink-dark">
              {headline}
            </h2>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-ink-muted dark:text-ink-dark-muted">
              {desc}
            </p>
            <ul className="mb-5 space-y-1.5">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-xs text-ink-muted dark:text-ink-dark-muted">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[9px] font-bold text-brand-on-soft">✓</span>
                  {perk}
                </li>
              ))}
            </ul>
            <div className="rounded-xl bg-brand px-4 py-2 text-center text-sm font-semibold text-white transition-colors group-hover:bg-brand-hover">
              {cta} →
            </div>
          </Link>
        ))}
      </div>

      {/* Platform features — compact secondary */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint">
          What&apos;s included
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ label, desc }) => (
            <div key={label} className="flex items-start gap-2.5 rounded-xl border border-surface-border bg-surface-raised p-3 dark:border-surface-dark-border dark:bg-surface-dark-raised">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-soft text-[9px] font-bold text-brand-on-soft">✓</span>
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