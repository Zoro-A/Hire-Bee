import { JobSeekerDashboard } from "../../pages/JobSeekerDashboard.jsx"
import { RecruiterDashboard } from "../../pages/RecruiterDashboard.jsx"
import { AdminDashboard } from "../../pages/AdminDashboard.jsx"

export function RoleRouter({ user, token }) {
  if (user.role === "job_seeker") return <JobSeekerDashboard token={token} user={user} />
  if (user.role === "recruiter") return <RecruiterDashboard token={token} user={user} />
  return <AdminDashboard token={token} user={user} />
}
