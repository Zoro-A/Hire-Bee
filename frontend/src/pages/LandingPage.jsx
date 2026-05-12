import { Link } from "react-router-dom"
import { cardClass, buttonClass } from "../styles/uiClasses.js"

export function LandingPage() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className={`${cardClass} space-y-4`}>
        <p className="inline-flex rounded-full border border-[#cdd2ea] px-3 py-1 text-xs font-semibold uppercase tracking-wider dark:border-[#32395f]">
          Production-ready hiring platform
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">Run hiring from first resume to final interview.</h1>
        <p className="text-sm text-[#4a5070] dark:text-[#aeb7df]">
          Complete flows for Job Seekers, Recruiters, and Admin with direct FastAPI integration.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/register?role=job_seeker" className={buttonClass}>Continue as Job Seeker</Link>
          <Link to="/register?role=recruiter" className="rounded-xl border border-[#c9cce5] px-4 py-2 text-sm font-semibold dark:border-[#303a63]">Continue as Recruiter</Link>
          <Link to="/register?role=admin" className="rounded-xl border border-[#c9cce5] px-4 py-2 text-sm font-semibold dark:border-[#303a63]">Continue as Admin</Link>
        </div>
      </div>
      <div className={`${cardClass} grid gap-3`}>
        {["Auth and RBAC", "Resume parsing and matching", "CV + cover letter generation", "Applications and status tracking", "Interview scheduling and email logs"].map((item) => (
          <div key={item} className="rounded-xl border border-[#e2e6f6] p-3 text-sm dark:border-[#283056]">{item}</div>
        ))}
      </div>
    </section>
  )
}
