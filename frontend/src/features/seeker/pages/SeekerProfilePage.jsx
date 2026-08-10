import { cardClass, inputClass } from "@/styles/uiClasses.js"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { useSeekerData } from "../SeekerDataContext.jsx"

export function SeekerProfilePage() {
  const { manualCv, setManualCv, profileSkills } = useSeekerData()

  return (
    <section className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      <PageHeader title="My Profile" description="Manage your profile and career details." />
      <div className="grid gap-4">
        <article className={cardClass}>
          <h2 className="text-2xl font-semibold">My Profile</h2>
          <p className="text-sm text-ink-muted">Manage your profile and career details.</p>
        </article>
        <article className={cardClass}>
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inputClass} aria-label="Full name" value={manualCv.full_name} onChange={(e) => setManualCv({ ...manualCv, full_name: e.target.value })} placeholder="Full name" />
            <input className={inputClass} aria-label="Email" value={manualCv.email} onChange={(e) => setManualCv({ ...manualCv, email: e.target.value })} placeholder="Email" />
            <input className={inputClass} aria-label="Phone" value={manualCv.phone} onChange={(e) => setManualCv({ ...manualCv, phone: e.target.value })} placeholder="Phone" />
            <input className={inputClass} aria-label="Location" value={manualCv.location} onChange={(e) => setManualCv({ ...manualCv, location: e.target.value })} placeholder="Location" />
            <input className={inputClass} aria-label="LinkedIn URL" value={manualCv.linkedin} onChange={(e) => setManualCv({ ...manualCv, linkedin: e.target.value })} placeholder="LinkedIn URL" />
            <input className={inputClass} aria-label="GitHub URL" value={manualCv.github} onChange={(e) => setManualCv({ ...manualCv, github: e.target.value })} placeholder="GitHub URL" />
            <input className={inputClass} aria-label="Skills, comma separated" value={manualCv.skills} onChange={(e) => setManualCv({ ...manualCv, skills: e.target.value })} placeholder="Skills comma separated" />
          </div>
          <div className="mt-4 rounded-xl border border-surface-border p-4">
            <p className="text-xs font-semibold uppercase text-ink-muted">Skill Highlights</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(profileSkills || "").split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
                <span key={skill} className="rounded-full bg-brand-soft px-2 py-1 text-xs text-brand-on-soft dark:bg-brand/15 dark:text-brand">{skill}</span>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
