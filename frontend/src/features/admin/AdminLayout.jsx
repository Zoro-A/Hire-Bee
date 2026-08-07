import { Outlet, useOutletContext } from "react-router-dom"
import { ADMIN_NAV } from "@/config/nav"
import { DashboardShell } from "@/components/layout/DashboardShell.jsx"
import { DashboardSidebar } from "@/components/layout/DashboardSidebar.jsx"
import { StatusBanner } from "@/components/feedback/StatusBanner.jsx"
import { AdminDataProvider, useAdminData } from "./AdminDataContext.jsx"

function AdminFrame() {
  const { error, setError } = useAdminData()
  return (
    <DashboardShell sidebar={<DashboardSidebar items={ADMIN_NAV} roleLabel="Admin" />}>
      <StatusBanner error={error} onDismiss={(which) => (which === "error" ? setError("") : null)} />
      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </DashboardShell>
  )
}

export function AdminLayout() {
  const { user, token } = useOutletContext()
  return (
    <AdminDataProvider token={token} user={user}>
      <AdminFrame />
    </AdminDataProvider>
  )
}
