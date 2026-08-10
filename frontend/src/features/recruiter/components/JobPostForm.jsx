import { Card } from "@/components/ui/card.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Textarea } from "@/components/ui/textarea.jsx"
import { Button } from "@/components/ui/button.jsx"
import { useRecruiterData } from "../RecruiterDataContext.jsx"

export function JobPostForm() {
  const { form, setForm, postJob, loading } = useRecruiterData()

  return (
    <Card className="block gap-0 p-5">
      <h2 className="mb-1 font-display font-semibold text-ink">Publish new role</h2>
      <p className="mb-4 text-xs text-ink-muted">Required skills are normalized for ATS matching and Qdrant indexing.</p>
      <form onSubmit={postJob} className="grid gap-3">
        <Input aria-label="Job title" placeholder="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <Textarea className="min-h-25" aria-label="Role description" placeholder="Role description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input aria-label="Location" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input aria-label="Annual salary" placeholder="Annual salary (number)" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
        </div>
        <Input aria-label="Contact email on listing" placeholder="Contact email on listing" value={form.recruiter_email} onChange={(e) => setForm({ ...form, recruiter_email: e.target.value })} required />
        <Input aria-label="Required skills, comma separated" placeholder="Required skills (comma separated)" value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} />
        <Button type="submit" aria-busy={loading.job} disabled={loading.job}>
          {loading.job ? "Publishing…" : "Publish job"}
        </Button>
      </form>
    </Card>
  )
}
