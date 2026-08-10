import { Outlet, useOutletContext } from "react-router-dom"
import { RECRUITER_NAV } from "@/config/nav"
import { DashboardShell } from "@/components/layout/DashboardShell.jsx"
import { DashboardSidebar } from "@/components/layout/DashboardSidebar.jsx"
import { StatusBanner } from "@/components/feedback/StatusBanner.jsx"
import { RecruiterDataProvider, useRecruiterData } from "./RecruiterDataContext.jsx"
import { ApplicantDetailSheet } from "./components/ApplicantDetailSheet.jsx"

function RecruiterFrame() {
  const { message, error, setMessage, setError, recruiterMeta } = useRecruiterData()
  return (
    <DashboardShell
      sidebar={
        <DashboardSidebar
          items={RECRUITER_NAV}
          roleLabel="Recruiter"
          roleSublabel={recruiterMeta?.company_name || "Your workspace"}
        />
      }
    >
      <StatusBanner
        message={message}
        error={error}
        onDismiss={(which) => (which === "error" ? setError("") : setMessage(""))}
      />
      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
      <ApplicantDetailSheet />
    </DashboardShell>
  )
}

export function RecruiterLayout() {
  const { user, token } = useOutletContext()
  return (
    <RecruiterDataProvider token={token} user={user}>
      <RecruiterFrame />
    </RecruiterDataProvider>
  )
}
