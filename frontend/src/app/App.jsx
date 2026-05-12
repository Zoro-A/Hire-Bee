import { useEffect, useState } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import { apiRequest } from "../lib/api.js"
import { AUTH_LAYOUT_PATHS } from "../constants/authLayout.js"
import { MarketingLayout } from "../components/layout/MarketingLayout.jsx"
import { AppSessionLoading } from "../components/layout/AppSessionLoading.jsx"
import { AppWorkspace } from "../components/layout/AppWorkspace.jsx"
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
  const authLayout = AUTH_LAYOUT_PATHS.has(location.pathname)
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

  const isAppShell = location.pathname === "/app" && Boolean(token)

  return (
    <div
      className={`transition-colors ${
        isAppShell
          ? "h-[100dvh] overflow-hidden bg-[#f4f6fb] text-[#161a2f] dark:bg-[#0a1022] dark:text-[#e8edff]"
          : `min-h-screen ${
              authLayout
                ? "bg-[#eef1f6] text-[#111827] dark:bg-[#0b1220] dark:text-[#e5e7eb]"
                : "bg-[#f4f6fb] text-[#161a2f] dark:bg-[#0a1022] dark:text-[#e8edff]"
            }`
      }`}
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
              <AppWorkspace user={user} token={token} setToken={setToken} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
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
