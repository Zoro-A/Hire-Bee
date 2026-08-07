import { cardClass, inputClass, buttonClass } from "@/styles/uiClasses.js"
import { useRecruiterData } from "../RecruiterDataContext.jsx"

export function RecruiterProfilePage() {
  const { profile, setProfile, saveProfile, loading, recruiterMeta } = useRecruiterData()

  return (
    <section className="min-h-0 flex-1 overflow-y-auto pr-1">
      <article className={`${cardClass} max-w-xl`}>
        <h3 className="mb-1 font-semibold">Company profile</h3>
        <p className="mb-4 text-xs text-ink-muted dark:text-ink-dark-muted">Create once via API; if you already have a profile, saving again may return an error — use the same email as on your job posts.</p>
        <form onSubmit={saveProfile} className="grid gap-3">
          <input className={inputClass} placeholder="Company name" value={profile.company_name} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} required />
          <input className={inputClass} placeholder="Recruiting contact email" value={profile.recruiter_email} onChange={(e) => setProfile({ ...profile, recruiter_email: e.target.value })} required />
          <button className={buttonClass} type="submit" disabled={loading.profile}>
            {loading.profile ? "Saving…" : recruiterMeta ? "Update (re-create if blocked)" : "Create profile"}
          </button>
        </form>
      </article>
    </section>
  )
}
