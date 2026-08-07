import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { apiRequest } from "@/lib/api.js"

const AdminDataContext = createContext(null)

export function AdminDataProvider({ token, user, children }) {
  const [users, setUsers] = useState([])
  const [recruiters, setRecruiters] = useState([])
  const [jobs, setJobs] = useState([])
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const refresh = useMemo(() => async () => {
    setLoading(true)
    setError("")
    try {
      const [u, r, j, e] = await Promise.all([
        apiRequest("/admin/users", {}, token),
        apiRequest("/admin/recruiters", {}, token),
        apiRequest("/jobs", {}, token),
        apiRequest("/emails/logs", {}, token),
      ])
      setUsers(u)
      setRecruiters(r)
      setJobs(j)
      setEmails(e)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    refresh().catch((err) => setError(err.message))
  }, [refresh])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Plain object, not useMemo: this provider re-renders on every state change
  // anyway (it owns a handful of useState calls), so every consumer downstream
  // already re-renders regardless of memoization. Memoizing here would only
  // add a dependency array that fights react-hooks/exhaustive-deps for zero
  // actual benefit.
  const value = {
    users,
    recruiters,
    jobs,
    emails,
    loading,
    error,
    setError,
    refresh,
    user,
    token,
  }

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- co-located hook, consistent with ThemeContext.jsx
export function useAdminData() {
  const ctx = useContext(AdminDataContext)
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider")
  return ctx
}
