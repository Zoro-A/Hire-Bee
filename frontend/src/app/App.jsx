import { useEffect, useState } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import { apiRequest } from "../lib/api.js"
import { MarketingLayout } from "../components/layout/MarketingLayout.jsx"
import { AppSessionLoading } from "../components/layout/AppSessionLoading.jsx"
import { AppLayout } from "../components/layout/AppLayout.jsx"
import { RoleHomeRedirect } from "../components/routing/RoleHomeRedirect.jsx"
import { RequireRole } from "../components/routing/RequireRole.jsx"
import { SeekerLayout } from "../features/seeker/SeekerLayout.jsx"
import { SeekerOverviewPage } from "../features/seeker/pages/SeekerOverviewPage.jsx"
import { SeekerResumePage } from "../features/seeker/pages/SeekerResumePage.jsx"
import { SeekerCvPage } from "../features/seeker/pages/SeekerCvPage.jsx"
import { SeekerJobsPage } from "../features/seeker/pages/SeekerJobsPage.jsx"
import { SeekerApplicationsPage } from "../features/seeker/pages/SeekerApplicationsPage.jsx"
import { SeekerEvaluationPage } from "../features/seeker/pages/SeekerEvaluationPage.jsx"
import { SeekerProfilePage } from "../features/seeker/pages/SeekerProfilePage.jsx"
import { RecruiterLayout } from "../features/recruiter/RecruiterLayout.jsx"
import { RecruiterOverviewPage } from "../features/recruiter/pages/RecruiterOverviewPage.jsx"
import { RecruiterJobsPage } from "../features/recruiter/pages/RecruiterJobsPage.jsx"
import { RecruiterApplicantsPage } from "../features/recruiter/pages/RecruiterApplicantsPage.jsx"
import { RecruiterInterviewsPage } from "../features/recruiter/pages/RecruiterInterviewsPage.jsx"
import { RecruiterEmailsPage } from "../features/recruiter/pages/RecruiterEmailsPage.jsx"
import { RecruiterProfilePage } from "../features/recruiter/pages/RecruiterProfilePage.jsx"
import { AdminLayout } from "../features/admin/AdminLayout.jsx"
import { AdminOverviewPage } from "../features/admin/pages/AdminOverviewPage.jsx"
import { AdminUsersPage } from "../features/admin/pages/AdminUsersPage.jsx"
import { AdminRecruitersPage } from "../features/admin/pages/AdminRecruitersPage.jsx"
import { AdminJobsPage } from "../features/admin/pages/AdminJobsPage.jsx"
import { AdminEmailsPage } from "../features/admin/pages/AdminEmailsPage.jsx"
import { LandingPage } from "../pages/LandingPage.jsx"
import { LoginPage } from "../pages/LoginPage.jsx"
import { RegisterPage } from "../pages/RegisterPage.jsx"
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage.jsx"
import { ResetPasswordPage } from "../pages/ResetPasswordPage.jsx"

function readStoredToken() {
  return localStorage.getItem("hirebee-token") ?? sessionStorage.getItem("hirebee-token") ?? ""
}

export default function App() {
  const location = useLocation()
  const [token, setToken] = useState(readStoredToken)
  const [user, setUser] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(() => Boolean(readStoredToken()))
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!token) {
      localStorage.removeItem("hirebee-token")
      sessionStorage.removeItem("hirebee-token")
      try {
        const toRemove = []
        for (let i = 0; i < window.localStorage.length; i += 1) {
          const k = window.localStorage.key(i)
          if (k && k.startsWith("hirebee:cvChat:")) toRemove.push(k)
        }
        toRemove.forEach((k) => window.localStorage.removeItem(k))
      } catch {
        /* ignore */
      }
      setUser(null)
      setSessionLoading(false)
      return
    }
    setSessionLoading(true)
    setUser(null)
    const persist = localStorage.getItem("hirebee-persist") ?? "local"
    if (persist === "session") {
      sessionStorage.setItem("hirebee-token", token)
      localStorage.removeItem("hirebee-token")
    } else {
      localStorage.setItem("hirebee-token", token)
      sessionStorage.removeItem("hirebee-token")
    }
    let cancelled = false
    apiRequest("/auth/me", {}, token)
      .then((u) => {
        if (!cancelled) {
          setUser(u)
          setSessionLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setToken("")
          setUser(null)
          setSessionLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [token])
  /* eslint-enable react-hooks/set-state-in-effect */

  const isAppShell = location.pathname.startsWith("/app") && Boolean(token)

  return (
    <div
      className={
        isAppShell
          ? "h-[100dvh] overflow-hidden bg-surface text-ink transition-colors"
          : "min-h-screen bg-surface text-ink transition-colors"
      }
    >
      <Routes>
        <Route
          path="/app"
          element={
            !token ? (
              <Navigate to="/login" replace />
            ) : sessionLoading ? (
              <AppSessionLoading />
            ) : user ? (
              <AppLayout user={user} token={token} setToken={setToken} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<RoleHomeRedirect user={user} />} />

          <Route
            path="seeker"
            element={
              <RequireRole user={user} role="job_seeker">
                <SeekerLayout />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<SeekerOverviewPage />} />
            <Route path="resume" element={<SeekerResumePage />} />
            <Route path="cv" element={<SeekerCvPage />} />
            <Route path="jobs" element={<SeekerJobsPage />} />
            <Route path="applications" element={<SeekerApplicationsPage />} />
            <Route path="evaluation" element={<SeekerEvaluationPage />} />
            <Route path="profile" element={<SeekerProfilePage />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Route>

          <Route
            path="recruiter"
            element={
              <RequireRole user={user} role="recruiter">
                <RecruiterLayout />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<RecruiterOverviewPage />} />
            <Route path="jobs" element={<RecruiterJobsPage />} />
            <Route path="applicants" element={<RecruiterApplicantsPage />} />
            <Route path="interviews" element={<RecruiterInterviewsPage />} />
            <Route path="emails" element={<RecruiterEmailsPage />} />
            <Route path="profile" element={<RecruiterProfilePage />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Route>

          <Route
            path="admin"
            element={
              <RequireRole user={user} role="admin">
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOverviewPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="recruiters" element={<AdminRecruitersPage />} />
            <Route path="jobs" element={<AdminJobsPage />} />
            <Route path="emails" element={<AdminEmailsPage />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Route>
        </Route>

        <Route element={<MarketingLayout user={user} setToken={setToken} />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage setToken={setToken} googleClientId={googleClientId} />} />
          <Route path="/register" element={<RegisterPage setToken={setToken} googleClientId={googleClientId} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Routes>
    </div>
  )
}
