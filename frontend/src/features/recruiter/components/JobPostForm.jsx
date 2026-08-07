import { cardClass, inputClass, buttonClass } from "@/styles/uiClasses.js"
import { useRecruiterData } from "../RecruiterDataContext.jsx"

export function JobPostForm() {
  const { form, setForm, postJob, loading } = useRecruiterData()

  return (
    <article className={cardClass}>
      <h3 className="mb-1 font-semibold">Publish new role</h3>
      <p className="mb-4 text-xs text-ink-muted dark:text-ink-dark-muted">Required skills are normalized for ATS matching and Qdrant indexing.</p>
      <form onSubmit={postJob} className="grid gap-3">
        <input className={inputClass} placeholder="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea className={`${inputClass} min-h-[100px]`} placeholder="Role description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={inputClass} placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input className={inputClass} placeholder="Annual salary (number)" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
        </div>
        <input className={inputClass} placeholder="Contact email on listing" value={form.recruiter_email} onChange={(e) => setForm({ ...form, recruiter_email: e.target.value })} required />
        <input className={inputClass} placeholder="Required skills (comma separated)" value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} />
        <button className={buttonClass} type="submit" disabled={loading.job}>
          {loading.job ? "Publishing…" : "Publish job"}
        </button>
      </form>
    </article>
  )
}
