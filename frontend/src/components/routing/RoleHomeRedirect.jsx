import { Navigate } from "react-router-dom"

// eslint-disable-next-line react-refresh/only-export-components -- small pure helper shared with RequireRole.jsx
export function roleHome(role) {
  if (role === "job_seeker") return "/app/seeker"
  if (role === "recruiter") return "/app/recruiter"
  return "/app/admin"
}

export function RoleHomeRedirect({ user }) {
  if (!user?.role) return <Navigate to="/login" replace />
  return <Navigate to={roleHome(user.role)} replace />
}
