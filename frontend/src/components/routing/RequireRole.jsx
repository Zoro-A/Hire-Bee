import { Navigate } from "react-router-dom"
import { roleHome } from "./RoleHomeRedirect.jsx"

export function RequireRole({ user, role, children }) {
  if (user.role !== role) return <Navigate to={roleHome(user.role)} replace />
  return children
}
