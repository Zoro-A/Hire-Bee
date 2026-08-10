import { Card } from "@/components/ui/card.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Button } from "@/components/ui/button.jsx"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { useRecruiterData } from "../RecruiterDataContext.jsx"

export function RecruiterProfilePage() {
  const { profile, setProfile, saveProfile, loading, recruiterMeta } = useRecruiterData()

  return (
    <section className="min-h-0 flex-1 overflow-y-auto pr-1">
      <PageHeader title="Company" />
      <Card className="block gap-0 p-5 max-w-xl">
        <p className="mb-4 text-xs text-ink-muted">Create once via API; if you already have a profile, saving again may return an error — use the same email as on your job posts.</p>
        <form onSubmit={saveProfile} className="grid gap-3">
          <Input aria-label="Company name" placeholder="Company name" value={profile.company_name} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} required />
          <Input aria-label="Recruiting contact email" placeholder="Recruiting contact email" value={profile.recruiter_email} onChange={(e) => setProfile({ ...profile, recruiter_email: e.target.value })} required />
          <Button type="submit" aria-busy={loading.profile} disabled={loading.profile}>
            {loading.profile ? "Saving…" : recruiterMeta ? "Update (re-create if blocked)" : "Create profile"}
          </Button>
        </form>
      </Card>
    </section>
  )
}
