import { Outlet, useOutletContext } from "react-router-dom"
import { SEEKER_NAV } from "@/config/nav"
import { DashboardShell } from "@/components/layout/DashboardShell.jsx"
import { DashboardSidebar } from "@/components/layout/DashboardSidebar.jsx"
import { StatusBanner } from "@/components/feedback/StatusBanner.jsx"
import { SeekerDataProvider, useSeekerData } from "./SeekerDataContext.jsx"

function SeekerFrame() {
  const { message, error, setMessage, setError } = useSeekerData()
  return (
    <DashboardShell sidebar={<DashboardSidebar items={SEEKER_NAV} roleLabel="Job Seeker" />}>
      <StatusBanner
        message={message}
        error={error}
        onDismiss={(which) => (which === "error" ? setError("") : setMessage(""))}
      />
      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </DashboardShell>
  )
}

export function SeekerLayout() {
  const { user, token } = useOutletContext()
  return (
    <SeekerDataProvider token={token} user={user}>
      <SeekerFrame />
    </SeekerDataProvider>
  )
}
