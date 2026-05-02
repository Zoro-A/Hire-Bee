import { GoogleLogin } from "@react-oauth/google"
import { useEffect, useMemo, useState } from "react"
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { useTheme } from "./themeContext.jsx"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1"

/** FastAPI often returns `detail` as a string (HTTPException) or a list of validation objects (422). */
function formatApiErrorDetail(detail) {
  if (detail == null) return ""
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item
        if (item && typeof item === "object" && "msg" in item) return String(item.msg)
        try {
          return JSON.stringify(item)
        } catch {
          return String(item)
        }
      })
      .join(" ")
  }
  if (typeof detail === "object" && "msg" in detail) return String(detail.msg)
  try {
    return JSON.stringify(detail)
  } catch {
    return String(detail)
  }
}

function formatJobMatchLabel(m) {
  if (m != null && typeof m.match_percentage === "number" && Number.isFinite(m.match_percentage)) {
    return `${Math.round(m.match_percentage)}% match`
  }
  return "—"
}

async function apiRequest(path, options = {}, token) {
  const headers = new Headers(options.headers ?? {})
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }
  if (token) headers.set("Authorization", `Bearer ${token}`)
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const data = await response.json()
      const formatted = formatApiErrorDetail(data.detail)
      if (formatted) message = formatted
    } catch {
      // no-op
    }
    throw new Error(message)
  }
  return response.status === 204 ? null : response.json()
}

/** Fetches export binary with Bearer token and triggers the browser download (saves to Downloads). */
async function downloadCvExport(cvId, format, token) {
  const headers = new Headers()
  if (token) headers.set("Authorization", `Bearer ${token}`)
  const response = await fetch(`${API_BASE}/cvs/${cvId}/download?export_format=${format}`, { headers })
  if (!response.ok) {
    let message = `Download failed (${response.status})`
    try {
      const data = await response.json()
      const formatted = formatApiErrorDetail(data.detail)
      if (formatted) message = formatted
    } catch {
      // no-op
    }
    throw new Error(message)
  }
  const blob = await response.blob()
  const cd = response.headers.get("content-disposition")
  let filename = `cv_${cvId}.${format}`
  const quoted = cd?.match(/filename="([^"]+)"/)
  const plain = cd?.match(/filename=([^;\s]+)/)
  if (quoted?.[1]) filename = quoted[1]
  else if (plain?.[1]) filename = plain[1].replaceAll('"', "")
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const inputClass =
  "w-full rounded-xl border border-[#c9cce5] bg-white px-3 py-2 text-sm outline-none focus:border-[#5f5fff] dark:border-[#32395f] dark:bg-[#171c34]"
const cardClass = "rounded-2xl border border-[#d8dcef] bg-white p-5 dark:border-[#2d355c] dark:bg-[#121831]"
const buttonClass = "rounded-xl bg-[#2a2354] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f1a3d]"

const DEFAULT_CV_SECTION_ORDER = ["summary", "education", "skills", "experience", "projects", "certifications"]
const CORE_CV_SECTION_KEYS = new Set(DEFAULT_CV_SECTION_ORDER)

const CORE_SECTION_LABELS = {
  summary: "Professional Summary",
  education: "Education",
  skills: "Skills (comma separated)",
  experience: "Work experience",
  projects: "Projects",
  certifications: "Certifications",
}

const SECTION_PRESET_OPTIONS = [
  { key: "achievements", label: "Achievements" },
  { key: "extracurricular", label: "Extra Curricular Activities" },
  { key: "awards", label: "Awards" },
  { key: "interests", label: "Interests" },
]

function getSectionDisplayLabel(key, sectionExtraLabels) {
  if (sectionExtraLabels?.[key]) return sectionExtraLabels[key]
  if (CORE_SECTION_LABELS[key]) return CORE_SECTION_LABELS[key]
  const opt = SECTION_PRESET_OPTIONS.find((o) => o.key === key)
  if (opt) return opt.label
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function slugCustomSectionKey(label) {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 36)
  return `custom_${slug || "section"}`
}

function safeExternalUrl(raw) {
  const s = String(raw ?? "").trim()
  if (!s) return "#"
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

function buildManualCvJson(manualCv, manualSectionOrder, sectionExtraLabels, user) {
  const header = {
    name: (manualCv.full_name || user.full_name || "").trim(),
    email: (manualCv.email || user.email || "").trim(),
    phone: (manualCv.phone || "").trim(),
    location: (manualCv.location || "").trim(),
    linkedin: (manualCv.linkedin || "").trim(),
    github: (manualCv.github || "").trim(),
  }
  const section_labels = { ...sectionExtraLabels }
  for (const key of manualSectionOrder) {
    if (!section_labels[key]) {
      const opt = SECTION_PRESET_OPTIONS.find((o) => o.key === key)
      if (opt) section_labels[key] = opt.label
    }
  }
  const sections = {}
  for (const key of manualSectionOrder) {
    const raw = manualCv[key] ?? ""
    if (key === "skills") {
      sections[key] = String(raw)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    } else if (key === "summary") {
      sections[key] = String(raw)
    } else {
      sections[key] = String(raw).trim() ? [{ text: String(raw) }] : []
    }
  }
  return {
    title: manualCv.title || "Untitled CV",
    header,
    section_order: [...manualSectionOrder],
    section_labels,
    sections,
  }
}

const AUTH_LAYOUT_PATHS = new Set(["/login", "/register", "/forgot-password", "/reset-password"])

function App() {
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const [token, setToken] = useState(
    () => localStorage.getItem("hirebee-token") ?? sessionStorage.getItem("hirebee-token") ?? "",
  )
  const [user, setUser] = useState(null)
  const authLayout = AUTH_LAYOUT_PATHS.has(location.pathname)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("hirebee-token")
      sessionStorage.removeItem("hirebee-token")
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(null)
      return
    }
    const persist = localStorage.getItem("hirebee-persist") ?? "local"
    if (persist === "session") {
      sessionStorage.setItem("hirebee-token", token)
      localStorage.removeItem("hirebee-token")
    } else {
      localStorage.setItem("hirebee-token", token)
      sessionStorage.removeItem("hirebee-token")
    }
    apiRequest("/auth/me", {}, token)
      .then(setUser)
      .catch(() => {
        setToken("")
        setUser(null)
      })
  }, [token])

  return (
    <div
      className={`min-h-screen transition-colors ${
        authLayout
          ? "bg-[#eef1f6] text-[#111827] dark:bg-[#0b1220] dark:text-[#e5e7eb]"
          : "bg-[#f4f6fb] text-[#161a2f] dark:bg-[#0a1022] dark:text-[#e8edff]"
      }`}
    >
      <header
        className={`mx-auto flex w-full items-center justify-between px-6 py-4 ${
          authLayout ? "max-w-lg" : "max-w-7xl"
        }`}
      >
        <Link to="/" className="flex items-center gap-2">
          <img src="/hirebee-logo.svg" alt="" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-bold text-[#1d4ed8] dark:text-[#60a5fa]">HireBee</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb] dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#e2e8f0] dark:hover:bg-[#334155]"
            aria-label="Toggle theme"
          >
            {isDark ? "Light mode" : "Dark mode"}
          </button>
          {!authLayout && user && (
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("hirebee-persist")
                setToken("")
              }}
              className="rounded-lg border border-[#c9cce5] px-3 py-2 text-sm dark:border-[#303a63]"
            >
              Logout
            </button>
          )}
          {!authLayout && !user && (
            <>
              <Link className="text-sm hover:underline" to="/login">
                Login
              </Link>
              <Link className={buttonClass} to="/register">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      <main className={authLayout ? "mx-auto w-full max-w-lg px-6 pb-12" : "mx-auto w-full max-w-7xl px-6 pb-12"}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage setToken={setToken} googleClientId={googleClientId} />} />
          <Route path="/register" element={<RegisterPage setToken={setToken} googleClientId={googleClientId} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/app" element={user ? <RoleRouter user={user} token={token} /> : <Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function Landing() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className={`${cardClass} space-y-4`}>
        <p className="inline-flex rounded-full border border-[#cdd2ea] px-3 py-1 text-xs font-semibold uppercase tracking-wider dark:border-[#32395f]">
          Production-ready hiring platform
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">Run hiring from first resume to final interview.</h1>
        <p className="text-sm text-[#4a5070] dark:text-[#aeb7df]">
          Complete flows for Job Seekers, Recruiters, and Admin with direct FastAPI integration.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/register?role=job_seeker" className={buttonClass}>Continue as Job Seeker</Link>
          <Link to="/register?role=recruiter" className="rounded-xl border border-[#c9cce5] px-4 py-2 text-sm font-semibold dark:border-[#303a63]">Continue as Recruiter</Link>
          <Link to="/register?role=admin" className="rounded-xl border border-[#c9cce5] px-4 py-2 text-sm font-semibold dark:border-[#303a63]">Continue as Admin</Link>
        </div>
      </div>
      <div className={`${cardClass} grid gap-3`}>
        {["Auth and RBAC", "Resume parsing and matching", "CV + cover letter generation", "Applications and status tracking", "Interview scheduling and email logs"].map((item) => (
          <div key={item} className="rounded-xl border border-[#e2e6f6] p-3 text-sm dark:border-[#283056]">{item}</div>
        ))}
      </div>
    </section>
  )
}

function fieldShell(children) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 dark:border-[#334155] dark:bg-[#1e293b]">
      {children}
    </div>
  )
}

function LoginPage({ setToken, googleClientId }) {
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(true)
  const [form, setForm] = useState({ email: "", password: "" })

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const loginData = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      localStorage.setItem("hirebee-persist", remember ? "local" : "session")
      if (remember) {
        localStorage.setItem("hirebee-token", loginData.access_token)
        sessionStorage.removeItem("hirebee-token")
      } else {
        sessionStorage.setItem("hirebee-token", loginData.access_token)
        localStorage.removeItem("hirebee-token")
      }
      setToken(loginData.access_token)
      navigate("/app")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function onGoogleSuccess(credentialResponse) {
    setError("")
    try {
      const data = await apiRequest("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential: credentialResponse.credential }),
      })
      localStorage.setItem("hirebee-persist", "local")
      localStorage.setItem("hirebee-token", data.access_token)
      sessionStorage.removeItem("hirebee-token")
      setToken(data.access_token)
      navigate("/app")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-sm dark:border-[#1e293b] dark:bg-[#111827]">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex justify-center">
          <img src="/hirebee-logo.svg" alt="" className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-semibold text-[#111827] dark:text-white">Sign in to your account</h1>
        <p className="mt-1 text-sm text-[#6b7280] dark:text-[#9ca3af]">Welcome back! Please enter your details</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151] dark:text-[#d1d5db]">Email</label>
          {fieldShell(
            <>
              <span className="text-[#9ca3af]" aria-hidden>✉</span>
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none dark:text-white"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </>,
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151] dark:text-[#d1d5db]">Password</label>
          {fieldShell(
            <>
              <span className="text-[#9ca3af]" aria-hidden>🔒</span>
              <input
                className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none dark:text-white"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </>,
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-[#4b5563] dark:text-[#9ca3af]">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded" />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-[#2563eb] hover:underline dark:text-[#60a5fa]">
            Forgot password?
          </Link>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#2563eb] py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      {googleClientId && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e5e7eb] dark:border-[#334155]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[#6b7280] dark:bg-[#111827] dark:text-[#9ca3af]">Or continue with</span>
            </div>
          </div>
          <div className="flex justify-center [&>div]:w-full">
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={() => setError("Google sign-in failed")}
              useOneTap={false}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              width="100%"
            />
          </div>
        </>
      )}
      <p className="mt-6 text-center text-sm text-[#6b7280] dark:text-[#9ca3af]">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-semibold text-[#2563eb] hover:underline dark:text-[#60a5fa]">
          Sign up
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-[#9ca3af]">
        By signing in, you agree to our <span className="text-[#2563eb] dark:text-[#60a5fa]">Terms</span> and{" "}
        <span className="text-[#2563eb] dark:text-[#60a5fa]">Privacy Policy</span>.
      </p>
    </div>
  )
}

function RegisterPage({ setToken, googleClientId }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: params.get("role") ?? "job_seeker",
  })

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await apiRequest("/auth/register", { method: "POST", body: JSON.stringify(form) })
      const loginData = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      localStorage.setItem("hirebee-persist", "local")
      localStorage.setItem("hirebee-token", loginData.access_token)
      sessionStorage.removeItem("hirebee-token")
      setToken(loginData.access_token)
      navigate("/app")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function onGoogleSuccess(credentialResponse) {
    setError("")
    try {
      const data = await apiRequest("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential: credentialResponse.credential }),
      })
      localStorage.setItem("hirebee-persist", "local")
      localStorage.setItem("hirebee-token", data.access_token)
      sessionStorage.removeItem("hirebee-token")
      setToken(data.access_token)
      navigate("/app")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-sm dark:border-[#1e293b] dark:bg-[#111827]">
      <div className="mb-6 text-center">
        <img src="/hirebee-logo.svg" alt="" className="mx-auto mb-3 h-12 w-12" />
        <h1 className="text-2xl font-semibold text-[#111827] dark:text-white">Create your account</h1>
        <p className="mt-1 text-sm text-[#6b7280] dark:text-[#9ca3af]">Join HireBee in a few steps</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <input className={inputClass} placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="job_seeker">Job seeker</option>
          <option value="recruiter">Recruiter</option>
          <option value="admin">Admin</option>
        </select>
        <input className={inputClass} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className={inputClass} type="password" placeholder="Password (min 8 characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#2563eb] py-3 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      {googleClientId && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e5e7eb] dark:border-[#334155]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[#6b7280] dark:bg-[#111827] dark:text-[#9ca3af]">Or continue with</span>
            </div>
          </div>
          <div className="flex justify-center [&>div]:w-full">
            <GoogleLogin onSuccess={onGoogleSuccess} onError={() => setError("Google sign-in failed")} useOneTap={false} theme="outline" size="large" text="continue_with" shape="rectangular" width="100%" />
          </div>
        </>
      )}
      <p className="mt-6 text-center text-sm text-[#6b7280] dark:text-[#9ca3af]">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-[#2563eb] hover:underline dark:text-[#60a5fa]">
          Sign in
        </Link>
      </p>
    </div>
  )
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [msg, setMsg] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setErr("")
    setMsg("")
    try {
      const res = await apiRequest("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) })
      setMsg(res.message)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-sm dark:border-[#1e293b] dark:bg-[#111827]">
      <h1 className="text-xl font-semibold text-[#111827] dark:text-white">Forgot password</h1>
      <p className="mt-1 text-sm text-[#6b7280] dark:text-[#9ca3af]">Enter your email and we&apos;ll send reset instructions if an account exists.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input className={inputClass} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#2563eb] py-3 text-sm font-semibold text-white hover:bg-[#1d4ed8]">
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="text-[#2563eb] hover:underline dark:text-[#60a5fa]">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}

function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [msg, setMsg] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setErr("")
    setMsg("")
    try {
      const res = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: password }),
      })
      setMsg(res.message)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-sm dark:border-[#1e293b] dark:bg-[#111827]">
      <h1 className="text-xl font-semibold text-[#111827] dark:text-white">Set new password</h1>
      {!token && <p className="mt-2 text-sm text-red-600">Missing token. Open the link from your email.</p>}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input className={inputClass} type="password" placeholder="New password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        <button type="submit" disabled={loading || !token} className="w-full rounded-xl bg-[#2563eb] py-3 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-50">
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="text-[#2563eb] hover:underline dark:text-[#60a5fa]">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}

function RoleRouter({ user, token }) {
  if (user.role === "job_seeker") return <JobSeekerDashboard token={token} user={user} />
  if (user.role === "recruiter") return <RecruiterDashboard token={token} user={user} />
  return <AdminDashboard token={token} user={user} />
}

function JobSeekerDashboard({ token, user }) {
  const { isDark } = useTheme()
  const navItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "resume", label: "Upload Resume" },
    { key: "cv", label: "Generate CV" },
    { key: "jobs", label: "Jobs" },
    { key: "applications", label: "Applications" },
    { key: "profile", label: "Profile" },
  ]
  const [activePage, setActivePage] = useState("dashboard")
  const [jobs, setJobs] = useState([])
  const [matches, setMatches] = useState([])
  const [apps, setApps] = useState([])
  const [cvs, setCvs] = useState([])
  const [letters, setLetters] = useState([])
  const [resumeId, setResumeId] = useState("")
  const [resumeInsight, setResumeInsight] = useState(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState({
    upload: false,
    cvUpload: false,
    manualCv: false,
    section: false,
    reorder: false,
    export: false,
    convoCv: false,
    convoChat: false,
    coverLetter: false,
    coverLetterSave: false,
    apply: false,
  })
  const [cvMode, setCvMode] = useState("manual")
  const [manualCv, setManualCv] = useState({
    title: "My ATS CV",
    full_name: user.full_name,
    email: user.email,
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    summary: "",
    education: "",
    skills: "",
    experience: "",
    projects: "",
    certifications: "",
  })
  const [manualSectionOrder, setManualSectionOrder] = useState(() => [...DEFAULT_CV_SECTION_ORDER])
  const [sectionExtraLabels, setSectionExtraLabels] = useState({})
  const [customSectionLabelInput, setCustomSectionLabelInput] = useState("")
  const [selectedCvId, setSelectedCvId] = useState("")
  const [jobQuery, setJobQuery] = useState("")
  const [selectedJobId, setSelectedJobId] = useState("")
  const [convoMessages, setConvoMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm here to help you build a strong CV. What roles are you targeting, and what's a quick overview of your background so far?",
    },
  ])
  const [convoInput, setConvoInput] = useState("")
  const [applyForm, setApplyForm] = useState({ job_id: "", generated_cv_id: "", cover_letter_id: "" })
  const [coverLetterDraft, setCoverLetterDraft] = useState("")
  const manualPreviewJson = useMemo(
    () => buildManualCvJson(manualCv, manualSectionOrder, sectionExtraLabels, user),
    [manualCv, manualSectionOrder, sectionExtraLabels, user],
  )
  const profileSkills = resumeInsight?.extracted_skills?.join(", ") || manualCv.skills || ""
  const selectedJob = jobs.find((job) => String(job.id) === String(selectedJobId || applyForm.job_id))
  const selectedJobLetter = useMemo(
    () => letters.find((letter) => String(letter.job_id) === String(selectedJobId || applyForm.job_id)),
    [letters, selectedJobId, applyForm.job_id],
  )
  const hasAppliedToSelectedJob = useMemo(
    () => apps.some((app) => String(app.job_id) === String(selectedJobId || applyForm.job_id)),
    [apps, selectedJobId, applyForm.job_id],
  )
  const matchByJobId = useMemo(() => {
    const map = new Map()
    for (const m of matches) map.set(m.job_id, m)
    return map
  }, [matches])
  const jobsSortedByMatch = useMemo(() => {
    return [...jobs].sort((a, b) => {
      const ma = matchByJobId.get(a.id)?.match_percentage ?? -1
      const mb = matchByJobId.get(b.id)?.match_percentage ?? -1
      if (mb !== ma) return mb - ma
      return b.id - a.id
    })
  }, [jobs, matchByJobId])
  const filteredJobs = jobsSortedByMatch.filter((job) => {
    const text = `${job.title} ${job.description} ${job.location || ""}`.toLowerCase()
    return text.includes(jobQuery.toLowerCase())
  })

  const refresh = useMemo(() => async () => {
    const [jobList, matchList, appList, cvList, letterList] = await Promise.all([
      apiRequest("/jobs", {}, token),
      apiRequest("/matching/jobs-for-me", {}, token).catch(() => []),
      apiRequest("/applications/me", {}, token),
      apiRequest("/cvs", {}, token),
      apiRequest("/cover-letters", {}, token),
    ])
    setJobs(jobList)
    setMatches(matchList)
    setApps(appList)
    setCvs(cvList)
    setLetters(letterList)
  }, [token])

  const selectedCv = useMemo(() => cvs.find((c) => String(c.id) === selectedCvId), [cvs, selectedCvId])

  function addPresetSection(key) {
    setManualSectionOrder((o) => {
      if (o.includes(key)) return o
      setManualCv((p) => ({ ...p, [key]: "" }))
      return [...o, key]
    })
  }

  function addCustomSection() {
    const label = customSectionLabelInput.trim()
    if (!label) {
      setError("Enter a name for your custom section.")
      return
    }
    setError("")
    setManualSectionOrder((order) => {
      let key = slugCustomSectionKey(label)
      let n = 0
      while (order.includes(key)) {
        n += 1
        key = `${slugCustomSectionKey(label)}_${n}`
      }
      setSectionExtraLabels((labs) => ({ ...labs, [key]: label }))
      setManualCv((p) => ({ ...p, [key]: "" }))
      return [...order, key]
    })
    setCustomSectionLabelInput("")
  }

  function removeSectionKey(key) {
    if (CORE_CV_SECTION_KEYS.has(key)) return
    setManualSectionOrder((o) => o.filter((k) => k !== key))
    setManualCv((p) => {
      const next = { ...p }
      delete next[key]
      return next
    })
    setSectionExtraLabels((labs) => {
      const next = { ...labs }
      delete next[key]
      return next
    })
  }

  function handleDragStartSection(e, index) {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/hirebee-section-idx", String(index))
  }

  function handleDragOverSection(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  function handleDropSection(e, dropIndex) {
    e.preventDefault()
    const from = parseInt(e.dataTransfer.getData("text/hirebee-section-idx"), 10)
    if (Number.isNaN(from) || from === dropIndex) return
    setManualSectionOrder((order) => {
      const next = [...order]
      const [moved] = next.splice(from, 1)
      const target = from < dropIndex ? dropIndex - 1 : dropIndex
      next.splice(target, 0, moved)
      return next
    })
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().catch((err) => setError(err.message))
  }, [refresh])

  useEffect(() => {
    if (!selectedJobId) return
    const letter = letters.find((item) => String(item.job_id) === String(selectedJobId))
    if (letter) {
      setCoverLetterDraft(letter.content || "")
      setApplyForm((prev) => ({ ...prev, cover_letter_id: String(letter.id) }))
    } else {
      setCoverLetterDraft("")
      setApplyForm((prev) => ({ ...prev, cover_letter_id: "" }))
    }
  }, [selectedJobId, letters])

  async function uploadResume(e) {
    e.preventDefault()
    setLoading((prev) => ({ ...prev, upload: true }))
    setError("")
    setMessage("")
    const file = e.target.resume.files[0]
    if (!file) {
      setError("Please select a PDF or DOCX file first.")
      setLoading((prev) => ({ ...prev, upload: false }))
      return
    }
    const fd = new FormData()
    fd.append("file", file)
    try {
      const data = await apiRequest("/resumes/upload", { method: "POST", body: fd, headers: {} }, token)
      setResumeId(String(data.resume_id))
      setResumeInsight(data)
      setMessage(`Resume uploaded. Parsed confidence: ${(data.parsing_confidence * 100).toFixed(1)}%`)
      setActivePage("resume")
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((prev) => ({ ...prev, upload: false }))
    }
  }

  async function createManualCv() {
    setLoading((prev) => ({ ...prev, manualCv: true }))
    setError("")
    setMessage("")
    try {
      const cv = await apiRequest("/cvs/manual", {
        method: "POST",
        body: JSON.stringify({
          title: manualCv.title,
          cv_json: manualPreviewJson,
        }),
      }, token)
      setSelectedCvId(String(cv.id))
      setApplyForm((prev) => ({ ...prev, generated_cv_id: String(cv.id) }))
      await refresh()
      setMessage("Manual CV created. Use export buttons to generate PDF or DOCX.")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((prev) => ({ ...prev, manualCv: false }))
    }
  }

  async function exportCv(format, cvIdOverride) {
    const cvId = cvIdOverride ?? selectedCvId
    if (!cvId) return setError("Select a CV first.")
    setLoading((prev) => ({ ...prev, export: true }))
    setError("")
    setMessage("")
    try {
      await apiRequest(`/cvs/${cvId}/export?export_format=${format}`, { method: "POST" }, token)
      await refresh()
      await downloadCvExport(cvId, format, token)
      setMessage(`CV exported — your ${format.toUpperCase()} should appear in your downloads folder.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((prev) => ({ ...prev, export: false }))
    }
  }

  async function downloadCvOnly(format, cvIdOverride) {
    const cvId = cvIdOverride ?? selectedCvId
    if (!cvId) return setError("Select a CV first.")
    setLoading((prev) => ({ ...prev, export: true }))
    setError("")
    setMessage("")
    try {
      await downloadCvExport(cvId, format, token)
      setMessage(`${format.toUpperCase()} download started.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((prev) => ({ ...prev, export: false }))
    }
  }

  async function handleConvoSend(e) {
    e.preventDefault()
    const trimmed = convoInput.trim()
    if (!trimmed || loading.convoChat) return
    setError("")
    setMessage("")
    const userLine = { role: "user", content: trimmed }
    const threadForRequest = [...convoMessages, userLine]
    setConvoMessages(threadForRequest)
    setConvoInput("")
    setLoading((prev) => ({ ...prev, convoChat: true }))
    try {
      const data = await apiRequest(
        "/cvs/conversation/chat",
        {
          method: "POST",
          body: JSON.stringify({
            messages: threadForRequest.map((m) => ({ role: m.role, content: m.content })),
          }),
        },
        token,
      )
      setConvoMessages((prev) => [...prev, { role: "assistant", content: data.reply || "" }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((prev) => ({ ...prev, convoChat: false }))
    }
  }

  async function generateConversationalCv() {
    setLoading((prev) => ({ ...prev, convoCv: true }))
    setError("")
    setMessage("")
    const transcript = convoMessages.filter((m) => (m.content || "").trim())
    const userTurns = transcript.filter((m) => m.role === "user").length
    if (userTurns < 2) {
      setError("Chat a bit more first — send at least two messages before generating your CV.")
      setLoading((prev) => ({ ...prev, convoCv: false }))
      return
    }
    try {
      const cv = await apiRequest("/cvs/conversation/generate", {
        method: "POST",
        body: JSON.stringify({
          title: `Conversational CV - ${user.full_name}`,
          messages: transcript.map((m) => ({ role: m.role, content: m.content })),
        }),
      }, token)
      const id = String(cv.id)
      setSelectedCvId(id)
      setApplyForm((prev) => ({ ...prev, generated_cv_id: id }))
      await refresh()
      await exportCv("pdf", id)
      setMessage("Conversational CV created and PDF export started (check your downloads).")
      setActivePage("cv")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((prev) => ({ ...prev, convoCv: false }))
    }
  }

  async function generateCoverLetter(jobId) {
    if (!jobId) {
      setError("Select a job first to generate a cover letter.")
      return
    }
    setLoading((prev) => ({ ...prev, coverLetter: true }))
    setError("")
    setMessage("")
    try {
      const letter = await apiRequest("/cover-letters/generate", {
        method: "POST",
        body: JSON.stringify({
          job_id: Number(jobId),
          tone: "professional",
          generated_cv_id: applyForm.generated_cv_id ? Number(applyForm.generated_cv_id) : null,
          resume_id: resumeId ? Number(resumeId) : null,
        }),
      }, token)
      setCoverLetterDraft(letter.content || "")
      setApplyForm((prev) => ({ ...prev, cover_letter_id: String(letter.id) }))
      await refresh()
      setMessage("Cover letter generated and saved.")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((prev) => ({ ...prev, coverLetter: false }))
    }
  }

  async function saveCoverLetterEdits() {
    if (!applyForm.cover_letter_id) {
      setError("Generate a cover letter first, then edit and save it.")
      return
    }
    if (!coverLetterDraft.trim()) {
      setError("Cover letter cannot be empty.")
      return
    }
    setLoading((prev) => ({ ...prev, coverLetterSave: true }))
    setError("")
    setMessage("")
    try {
      await apiRequest(`/cover-letters/${Number(applyForm.cover_letter_id)}`, {
        method: "PATCH",
        body: JSON.stringify({ content: coverLetterDraft }),
      }, token)
      await refresh()
      setMessage("Cover letter updated.")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((prev) => ({ ...prev, coverLetterSave: false }))
    }
  }

  async function applyToJob() {
    if (!applyForm.job_id) {
      setError("Please select a job before submitting your application.")
      return
    }
    setLoading((prev) => ({ ...prev, apply: true }))
    setError("")
    setMessage("")
    try {
      await apiRequest("/applications", {
        method: "POST",
        body: JSON.stringify({
          job_id: Number(applyForm.job_id),
          resume_id: resumeId ? Number(resumeId) : null,
          generated_cv_id: applyForm.generated_cv_id ? Number(applyForm.generated_cv_id) : null,
          cover_letter_id: applyForm.cover_letter_id ? Number(applyForm.cover_letter_id) : null,
        }),
      }, token)
      await refresh()
      setMessage("Application submitted successfully.")
      setActivePage("applications")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((prev) => ({ ...prev, apply: false }))
    }
  }

  async function uploadCvForQuickApply(file) {
    if (!file) {
      setError("Please choose a CV file first.")
      return
    }
    setLoading((prev) => ({ ...prev, cvUpload: true }))
    setError("")
    setMessage("")
    const fd = new FormData()
    fd.append("file", file)
    try {
      const data = await apiRequest("/resumes/upload", { method: "POST", body: fd, headers: {} }, token)
      setResumeId(String(data.resume_id))
      setResumeInsight(data)
      setMessage("New CV uploaded and attached for Quick Apply.")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((prev) => ({ ...prev, cvUpload: false }))
    }
  }

  return (
    <section className="grid min-h-[calc(100vh-120px)] gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-[#182742] bg-[#0f1d35] p-4 text-white dark:border-[#1f2d4d]">
        <div className="border-b border-[#223559] pb-4">
          <p className="text-xs uppercase tracking-wider text-[#9db6df]">HireBee</p>
          <p className="mt-1 text-lg font-semibold">Job Seeker</p>
        </div>
        <div className="mt-4 grid gap-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActivePage(item.key)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition ${activePage === item.key ? "bg-[#1f6feb] text-white" : "text-[#d2ddf5] hover:bg-[#152848]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-8 border-t border-[#223559] pt-3 text-xs text-[#8ca8d8]">
          Theme: {isDark ? "Dark" : "Light"}
        </div>
      </aside>

      <div className="grid gap-4">
        {message && <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {activePage === "dashboard" && (
          <section className="grid gap-4 md:grid-cols-4">
            <Metric label="Resume Score" value={`${Math.min(98, Math.max(52, Math.round((resumeInsight?.parsing_confidence || 0.6) * 100)))}%`} />
            <Metric label="Applications" value={apps.length} />
            <Metric label="Interviews" value={apps.filter((a) => a.status === "interview").length} />
            <Metric label="Profile Views" value={145} />
            <article className={`${cardClass} md:col-span-4`}>
              <h3 className="mb-3 font-semibold">Quick Actions</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <button type="button" onClick={() => setActivePage("resume")} className="rounded-xl border border-[#dbe2f7] p-4 text-left hover:bg-[#f2f5ff] dark:border-[#283056] dark:hover:bg-[#151f3a]"><p className="font-semibold">Upload Resume</p><p className="text-xs text-[#65709a]">Get AI-powered analysis</p></button>
                <button type="button" onClick={() => setActivePage("cv")} className="rounded-xl border border-[#dbe2f7] p-4 text-left hover:bg-[#f2f5ff] dark:border-[#283056] dark:hover:bg-[#151f3a]"><p className="font-semibold">Generate CV</p><p className="text-xs text-[#65709a]">Create ATS-friendly CV</p></button>
                <button type="button" onClick={() => setActivePage("jobs")} className="rounded-xl border border-[#dbe2f7] p-4 text-left hover:bg-[#f2f5ff] dark:border-[#283056] dark:hover:bg-[#151f3a]"><p className="font-semibold">Browse Jobs</p><p className="text-xs text-[#65709a]">Find your next role</p></button>
              </div>
            </article>
            <article className={`${cardClass} md:col-span-4`}>
              <h3 className="mb-3 font-semibold">Recommended Jobs</h3>
              <div className="grid gap-3">
                {jobsSortedByMatch.slice(0, 4).map((job) => {
                  const m = matchByJobId.get(job.id)
                  return (
                    <button key={job.id} type="button" onClick={() => { setSelectedJobId(String(job.id)); setApplyForm((p) => ({ ...p, job_id: String(job.id) })); setActivePage("jobs") }} className="rounded-xl border border-[#e2e6f6] p-3 text-left text-sm hover:bg-[#f5f8ff] dark:border-[#283056] dark:hover:bg-[#141d37]">
                      <p className="font-semibold">{job.title}</p>
                      <p className="text-xs">{job.location || "Remote"} | {job.required_skills.join(", ")}</p>
                      <span className="mt-2 inline-flex rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{formatJobMatchLabel(m)}</span>
                    </button>
                  )
                })}
              </div>
            </article>
          </section>
        )}

        {activePage === "resume" && (
          <section className="grid gap-6 lg:grid-cols-2">
            <article className={`${cardClass} lg:col-span-2`}>
              <h3 className="mb-2 text-xl font-semibold">Upload Resume</h3>
              <p className="text-sm text-[#65709a]">Upload your resume for AI-powered analysis.</p>
              <form onSubmit={uploadResume} className="mt-4 rounded-xl border border-dashed border-[#c8d2ef] p-8 text-center dark:border-[#2f3d65]">
                <input className="mx-auto block w-full max-w-xs text-sm" type="file" name="resume" accept=".pdf,.docx" />
                <button disabled={loading.upload} className={`${buttonClass} mt-4`} type="submit">{loading.upload ? "Uploading Resume..." : "Upload Resume"}</button>
                <p className="mt-2 text-xs text-[#65709a]">PDF or DOCX (max 10MB recommended)</p>
              </form>
              {loading.upload && (
                <div className="mt-4 rounded-xl border border-[#d8e2ff] bg-[#f1f5ff] p-3">
                  <p className="text-sm font-semibold text-[#2f4ea6]">Uploading Resume...</p>
                </div>
              )}
            </article>
            <article className={cardClass}>
              <h3 className="mb-3 font-semibold">Profile Snapshot</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {resumeInsight?.parsed_data?.name || user.full_name}</p>
                <p><strong>Email:</strong> {resumeInsight?.parsed_data?.email || user.email}</p>
                <p><strong>Phone:</strong> {resumeInsight?.parsed_data?.phone || "Not detected yet"}</p>
                <p><strong>Confidence:</strong> {resumeInsight ? `${Math.round(resumeInsight.parsing_confidence * 100)}%` : "N/A"}</p>
              </div>
            </article>
            <article className={cardClass}>
              <h3 className="mb-3 font-semibold">Extracted Content</h3>
              {resumeInsight ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-[#5f67a4]">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {(resumeInsight.extracted_skills || []).map((skill) => (
                        <span key={skill} className="rounded bg-[#e8edff] px-2 py-1 text-xs text-[#24408f]">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-[#5f67a4]">Summary</p>
                    <p className="rounded-xl border border-[#dce5ff] p-3 text-sm">{resumeInsight.parsed_data?.summary || "Summary not detected."}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#5f67a4]">Upload resume to view extraction cards.</p>
              )}
            </article>
          </section>
        )}

        {activePage === "cv" && (
          <section className="grid gap-6">
          <article className={cardClass}>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setCvMode("manual")} className={`rounded-xl px-3 py-2 text-sm ${cvMode === "manual" ? "bg-[#2a2354] text-white" : "border border-[#c9cce5] dark:border-[#303a63]"}`}>Manual CV Generator</button>
              <button type="button" onClick={() => setCvMode("conversational")} className={`rounded-xl px-3 py-2 text-sm ${cvMode === "conversational" ? "bg-[#2a2354] text-white" : "border border-[#c9cce5] dark:border-[#303a63]"}`}>Conversational CV Generator</button>
            </div>
          </article>

          {cvMode === "manual" ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <article className={cardClass}>
                <h3 className="mb-3 font-semibold">Input Sections</h3>
                <div className="grid gap-3">
                  <input className={inputClass} placeholder="CV title" value={manualCv.title} onChange={(e) => setManualCv({ ...manualCv, title: e.target.value })} />
                  <input className={inputClass} placeholder="Full name" value={manualCv.full_name} onChange={(e) => setManualCv({ ...manualCv, full_name: e.target.value })} />
                  <div className="grid gap-2 md:grid-cols-2">
                    <input className={inputClass} placeholder="Email" value={manualCv.email} onChange={(e) => setManualCv({ ...manualCv, email: e.target.value })} />
                    <input className={inputClass} placeholder="Phone" value={manualCv.phone} onChange={(e) => setManualCv({ ...manualCv, phone: e.target.value })} />
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <input className={inputClass} placeholder="Location (optional)" value={manualCv.location} onChange={(e) => setManualCv({ ...manualCv, location: e.target.value })} />
                    <input className={inputClass} placeholder="LinkedIn URL" value={manualCv.linkedin} onChange={(e) => setManualCv({ ...manualCv, linkedin: e.target.value })} />
                    <input className={inputClass} placeholder="GitHub URL" value={manualCv.github} onChange={(e) => setManualCv({ ...manualCv, github: e.target.value })} />
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5f67a4] dark:text-[#8ca8d8]">Sections — drag ⋮⋮ to reorder</p>
                  {manualSectionOrder.map((key, idx) => (
                    <div
                      key={key}
                      className="rounded-xl border border-[#e5e7eb] bg-[#fafbff] p-3 dark:border-[#334155] dark:bg-[#151c31]"
                      onDragOver={handleDragOverSection}
                      onDrop={(e) => handleDropSection(e, idx)}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          draggable
                          onDragStart={(e) => handleDragStartSection(e, idx)}
                          className="mt-1 cursor-grab select-none rounded border border-[#d1d5db] px-1.5 py-1 text-xs text-[#6b7280] hover:bg-[#f3f4f6] active:cursor-grabbing dark:border-[#475569] dark:text-[#94a3b8] dark:hover:bg-[#334155]"
                          aria-label="Drag to reorder section"
                          title="Drag to reorder"
                        >
                          ⋮⋮
                        </button>
                        <div className="min-w-0 flex-1">
                          <label className="mb-1 block text-xs font-medium text-[#374151] dark:text-[#cbd5e1]" htmlFor={`cv-section-${key}`}>
                            {getSectionDisplayLabel(key, sectionExtraLabels)}
                          </label>
                          {key === "skills" ? (
                            <textarea
                              id={`cv-section-${key}`}
                              className={inputClass}
                              rows={2}
                              value={manualCv[key] ?? ""}
                              onChange={(e) => setManualCv({ ...manualCv, [key]: e.target.value })}
                              onDragOver={handleDragOverSection}
                              onDrop={(e) => handleDropSection(e, idx)}
                              placeholder="Comma-separated skills"
                            />
                          ) : (
                            <textarea
                              id={`cv-section-${key}`}
                              className={inputClass}
                              rows={key === "summary" ? 3 : 4}
                              value={manualCv[key] ?? ""}
                              onChange={(e) => setManualCv({ ...manualCv, [key]: e.target.value })}
                              onDragOver={handleDragOverSection}
                              onDrop={(e) => handleDropSection(e, idx)}
                              placeholder={key === "summary" ? "Professional summary" : `Enter ${getSectionDisplayLabel(key, sectionExtraLabels).toLowerCase()}…`}
                            />
                          )}
                        </div>
                        {!CORE_CV_SECTION_KEYS.has(key) && (
                          <button
                            type="button"
                            className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                            onClick={() => removeSectionKey(key)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-dashed border-[#c8d2ef] p-3 dark:border-[#3d4a6b]">
                  <p className="mb-2 text-xs font-semibold text-[#5f67a4] dark:text-[#8ca8d8]">Add a section</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <select
                      className={`${inputClass} sm:max-w-xs`}
                      aria-label="Add preset section"
                      defaultValue=""
                      onChange={(e) => {
                        const v = e.target.value
                        if (v) {
                          addPresetSection(v)
                          e.target.value = ""
                        }
                      }}
                    >
                      <option value="" disabled>
                        Choose a preset…
                      </option>
                      {SECTION_PRESET_OPTIONS.filter((o) => !manualSectionOrder.includes(o.key)).map((o) => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <input
                      className={`${inputClass} min-w-[8rem] flex-1`}
                      value={customSectionLabelInput}
                      onChange={(e) => setCustomSectionLabelInput(e.target.value)}
                      placeholder="Custom section title"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addCustomSection()
                        }
                      }}
                    />
                    <button type="button" className={buttonClass} onClick={addCustomSection}>
                      Add custom
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 border-t border-[#e5e7eb] pt-4 dark:border-[#334155]">
                  <select className={inputClass} value={selectedCvId} onChange={(e) => setSelectedCvId(e.target.value)}>
                    <option value="">Select created CV for export</option>
                    {cvs.map((cv) => (
                      <option key={cv.id} value={cv.id}>
                        {cv.title} (#{cv.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className={buttonClass} type="button" disabled={loading.manualCv} onClick={createManualCv}>
                    {loading.manualCv ? "Creating..." : "Create / Update CV"}
                  </button>
                  <button className={buttonClass} type="button" disabled={loading.export} onClick={() => exportCv("pdf")}>
                    {loading.export ? "Exporting..." : "Export PDF"}
                  </button>
                  <button className="rounded-xl border border-[#c9cce5] px-4 py-2 text-sm dark:border-[#303a63]" type="button" disabled={loading.export} onClick={() => exportCv("docx")}>
                    {loading.export ? "Exporting..." : "Export DOCX"}
                  </button>
                </div>
              </article>
              <article className={cardClass}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">Live CV Preview</h3>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">ATS Score: 94%</span>
                    <button
                      type="button"
                      disabled={loading.export || !selectedCvId || !selectedCv?.pdf_path}
                      onClick={() => downloadCvOnly("pdf")}
                      className="rounded-lg border border-[#2563eb] bg-white px-3 py-1.5 text-xs font-semibold text-[#2563eb] hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#60a5fa] dark:bg-[#1e293b] dark:text-[#93c5fd] dark:hover:bg-[#334155]"
                    >
                      Download PDF
                    </button>
                    <button
                      type="button"
                      disabled={loading.export || !selectedCvId || !selectedCv?.docx_path}
                      onClick={() => downloadCvOnly("docx")}
                      className="rounded-lg border border-[#2563eb] bg-white px-3 py-1.5 text-xs font-semibold text-[#2563eb] hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#60a5fa] dark:bg-[#1e293b] dark:text-[#93c5fd] dark:hover:bg-[#334155]"
                    >
                      Download DOCX
                    </button>
                  </div>
                </div>
                <div className="rounded-xl border border-[#dbe2f7] p-5 dark:border-[#283056]">
                  <h4 className="text-2xl font-semibold">{manualCv.full_name || "Your Name"}</h4>
                  <p className="mt-1 text-sm text-[#5f67a4] dark:text-[#94a3b8]">
                    {[manualCv.email, manualCv.phone, manualCv.location].filter(Boolean).join(" • ") || "email@example.com"}
                  </p>
                  {(manualCv.linkedin?.trim() || manualCv.github?.trim()) && (
                    <p className="mt-2 flex flex-wrap gap-4 text-sm">
                      {manualCv.linkedin?.trim() && (
                        <a href={safeExternalUrl(manualCv.linkedin)} target="_blank" rel="noreferrer" className="font-medium text-[#2563eb] hover:underline dark:text-[#60a5fa]">
                          LinkedIn
                        </a>
                      )}
                      {manualCv.github?.trim() && (
                        <a href={safeExternalUrl(manualCv.github)} target="_blank" rel="noreferrer" className="font-medium text-[#2563eb] hover:underline dark:text-[#60a5fa]">
                          GitHub
                        </a>
                      )}
                    </p>
                  )}
                  <hr className="my-4 border-[#dbe2f7] dark:border-[#283056]" />
                  {manualSectionOrder.map((key, pidx) => {
                    const label = getSectionDisplayLabel(key, sectionExtraLabels)
                    const raw = manualCv[key] ?? ""
                    const emptyHint = key === "skills" ? "Add comma-separated skills." : `Add ${label.toLowerCase()}.`
                    return (
                      <div key={`preview-${key}`} className={pidx ? "mt-4" : ""}>
                        <h5 className="font-semibold">{label}</h5>
                        {key === "skills" ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {String(raw)
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .map((skill) => (
                                <span key={skill} className="rounded bg-[#e8edff] px-2 py-1 text-xs text-[#24408f] dark:bg-[#1e3a5f] dark:text-[#93c5fd]">
                                  {skill}
                                </span>
                              ))}
                            {!String(raw).trim() && <p className="mt-1 text-sm text-[#65709a]">{emptyHint}</p>}
                          </div>
                        ) : key === "summary" ? (
                          <p className="mt-1 text-sm">{raw || emptyHint}</p>
                        ) : (
                          <p className="mt-1 text-sm whitespace-pre-line">{raw || emptyHint}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </article>
            </div>
          ) : (
            <article className={cardClass}>
              <h3 className="mb-3 font-semibold">Conversational CV Generator</h3>
              <p className="mb-2 text-sm text-[#65709a]">
                Chat naturally with the coach, then generate your CV. PDF is exported to your device after generation (same as manual flow).
              </p>
              <div className="max-h-72 space-y-2 overflow-auto rounded-xl border border-[#d9deef] bg-[#f8f9ff] p-3 dark:border-[#2f3862] dark:bg-[#10162d]">
                {convoMessages.map((msg, idx) => (
                  <div
                    key={`${msg.role}-${idx}`}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      msg.role === "assistant" ? "bg-[#eaf0ff] text-[#25305e] dark:bg-[#1d2544] dark:text-[#cdd7ff]" : "bg-[#2a2354] text-white"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
              <form onSubmit={handleConvoSend} className="mt-3 flex gap-2">
                <input
                  className={inputClass}
                  value={convoInput}
                  onChange={(e) => setConvoInput(e.target.value)}
                  placeholder={loading.convoChat ? "Waiting for reply…" : "Type anything about your goals, skills, or experience…"}
                  disabled={loading.convoChat}
                />
                <button className={buttonClass} type="submit" disabled={loading.convoChat}>
                  {loading.convoChat ? "…" : "Send"}
                </button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="rounded-xl bg-[#006f53] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005944] disabled:opacity-60"
                  disabled={loading.convoCv}
                  type="button"
                  onClick={generateConversationalCv}
                >
                  {loading.convoCv ? "Generating..." : "Generate Conversational CV"}
                </button>
                <button
                  className={buttonClass}
                  type="button"
                  disabled={loading.export || !selectedCvId}
                  onClick={() => exportCv("pdf")}
                >
                  {loading.export ? "Exporting..." : "Export PDF"}
                </button>
                <button
                  className="rounded-xl border border-[#c9cce5] px-4 py-2 text-sm dark:border-[#303a63]"
                  type="button"
                  disabled={loading.export || !selectedCvId}
                  onClick={() => exportCv("docx")}
                >
                  {loading.export ? "Exporting..." : "Export DOCX"}
                </button>
              </div>
            </article>
          )}
          </section>
        )}

        {activePage === "jobs" && (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <article className={cardClass}>
              <h3 className="mb-2 text-2xl font-semibold">Job Recommendations</h3>
              <p className="mb-3 text-sm text-[#65709a]">AI-powered matches based on your profile.</p>
              <input className={inputClass} placeholder="Search by job title, company, or keywords..." value={jobQuery} onChange={(e) => setJobQuery(e.target.value)} />
              <div className="mt-4 grid gap-3">
                {filteredJobs.map((job) => {
                  const m = matchByJobId.get(job.id)
                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => {
                        setSelectedJobId(String(job.id))
                        setApplyForm((prev) => ({ ...prev, job_id: String(job.id) }))
                      }}
                      className={`rounded-xl border p-4 text-left text-sm dark:border-[#283056] ${
                        String(job.id) === String(selectedJobId)
                          ? "border-[#2f67ff] bg-[#f3f7ff] dark:bg-[#11254b]"
                          : "border-[#e2e6f6] hover:bg-[#f6f9ff] dark:hover:bg-[#151f3a]"
                      }`}
                    >
                      <p className="text-lg font-semibold">{job.title}</p>
                      <p className="text-xs text-[#65709a]">{job.location || "Remote"} • ${job.salary || "N/A"}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{formatJobMatchLabel(m)}</span>
                        <span className="text-xs text-[#65709a]">Apply now</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </article>
            <article className={cardClass}>
              <h3 className="mb-3 text-2xl font-semibold">{selectedJob?.title || "Select a job"}</h3>
              {selectedJob ? (
                <>
                  <p className="text-sm text-[#65709a]">{selectedJob.location || "Remote"} • {selectedJob.recruiter_email}</p>
                  <h4 className="mt-4 font-semibold">About the role</h4>
                  <p className="mt-1 text-sm whitespace-pre-line">{selectedJob.description}</p>
                  <h4 className="mt-4 font-semibold">Quick Apply</h4>
                  <div className="mt-2 rounded-xl border border-[#dbe2f7] p-3 text-sm dark:border-[#283056]">
                    <p className="text-xs font-semibold uppercase text-[#5f67a4]">AI-generated cover letter</p>
                    <textarea
                      className={`${inputClass} mt-2 min-h-44`}
                      value={coverLetterDraft}
                      onChange={(e) => setCoverLetterDraft(e.target.value)}
                      placeholder="Generate a cover letter, then edit it before applying."
                    />
                    <p className="mt-2 text-xs text-[#65709a]">
                      {selectedJobLetter ? `Using cover letter #${selectedJobLetter.id}` : "No cover letter linked yet."}
                    </p>
                  </div>
                  <div className="mt-3 rounded-xl border border-[#dbe2f7] p-3 text-sm dark:border-[#283056]">
                    <p className="text-xs font-semibold uppercase text-[#5f67a4]">Attached CV</p>
                    <select
                      className={`${inputClass} mt-2`}
                      value={applyForm.generated_cv_id}
                      onChange={(e) => setApplyForm((prev) => ({ ...prev, generated_cv_id: e.target.value }))}
                    >
                      <option value="">Select from saved CVs</option>
                      {cvs.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          {cv.title} (#{cv.id})
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-[#65709a]">
                      {applyForm.generated_cv_id
                        ? `Using saved CV: ${cvs.find((cv) => String(cv.id) === String(applyForm.generated_cv_id))?.title || "Selected"}`
                        : resumeId
                          ? `Using uploaded CV/Resume ID: ${resumeId}`
                          : "No CV selected yet"}
                    </p>
                    <label className="mt-3 block text-xs font-semibold uppercase text-[#5f67a4]">Or upload a new CV (PDF/DOCX)</label>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      className="mt-2 block w-full text-xs"
                      onChange={(e) => uploadCvForQuickApply(e.target.files?.[0])}
                    />
                    {loading.cvUpload && <p className="mt-2 text-xs text-[#2f4ea6]">Uploading and attaching new CV...</p>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className={buttonClass} type="button" disabled={loading.coverLetter} onClick={() => generateCoverLetter(selectedJob.id)}>{loading.coverLetter ? "Generating..." : "Generate Cover Letter"}</button>
                    <button className="rounded-xl border border-[#c9cce5] px-4 py-2 text-sm dark:border-[#303a63]" type="button" disabled={loading.coverLetterSave || !applyForm.cover_letter_id} onClick={saveCoverLetterEdits}>{loading.coverLetterSave ? "Saving..." : "Save Cover Letter"}</button>
                    <button className={buttonClass} type="button" disabled={loading.apply || hasAppliedToSelectedJob} onClick={applyToJob}>{loading.apply ? "Applying..." : hasAppliedToSelectedJob ? "Already Applied" : "Apply Now"}</button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#65709a]">Pick a job from the list to view full details and quick apply panel.</p>
              )}
            </article>
          </section>
        )}

        {activePage === "applications" && (
          <section className="grid gap-6">
          <article className={cardClass}>
            <h3 className="mb-3 text-2xl font-semibold">My Applications</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Total Applications" value={apps.length} />
              <Metric label="Under Review" value={apps.filter((a) => a.status === "applied" || a.status === "shortlisted").length} />
              <Metric label="Interviews" value={apps.filter((a) => a.status === "interview").length} />
            </div>
          </article>

          <article className={cardClass}>
            <h3 className="mb-3 font-semibold">Application Status Tracking</h3>
            <div className="grid gap-2 text-sm">
              {apps.map((app) => {
                const jobTitle = jobs.find((job) => job.id === app.job_id)?.title ?? `Job #${app.job_id}`
                return (
                  <div key={app.id} className="rounded-xl border border-[#e2e6f6] p-3 dark:border-[#283056]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{jobTitle}</p>
                        <p className="text-xs">Application #{app.id}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                )
              })}
            </div>
          </article>
          </section>
        )}

        {activePage === "profile" && (
          <section className="grid gap-4">
            <article className={cardClass}>
              <h3 className="text-2xl font-semibold">My Profile</h3>
              <p className="text-sm text-[#65709a]">Manage your profile and career details.</p>
            </article>
            <article className={cardClass}>
              <div className="grid gap-3 md:grid-cols-2">
                <input className={inputClass} value={manualCv.full_name} onChange={(e) => setManualCv({ ...manualCv, full_name: e.target.value })} placeholder="Full name" />
                <input className={inputClass} value={manualCv.email} onChange={(e) => setManualCv({ ...manualCv, email: e.target.value })} placeholder="Email" />
                <input className={inputClass} value={manualCv.phone} onChange={(e) => setManualCv({ ...manualCv, phone: e.target.value })} placeholder="Phone" />
                <input className={inputClass} value={manualCv.location} onChange={(e) => setManualCv({ ...manualCv, location: e.target.value })} placeholder="Location" />
                <input className={inputClass} value={manualCv.linkedin} onChange={(e) => setManualCv({ ...manualCv, linkedin: e.target.value })} placeholder="LinkedIn URL" />
                <input className={inputClass} value={manualCv.github} onChange={(e) => setManualCv({ ...manualCv, github: e.target.value })} placeholder="GitHub URL" />
                <input className={inputClass} value={manualCv.skills} onChange={(e) => setManualCv({ ...manualCv, skills: e.target.value })} placeholder="Skills comma separated" />
              </div>
              <div className="mt-4 rounded-xl border border-[#dbe2f7] p-4 dark:border-[#283056]">
                <p className="text-xs font-semibold uppercase text-[#5f67a4]">Skill Highlights</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(profileSkills || "").split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
                    <span key={skill} className="rounded bg-[#e8edff] px-2 py-1 text-xs text-[#24408f]">{skill}</span>
                  ))}
                </div>
              </div>
            </article>
          </section>
        )}
      </div>
    </section>
  )
}

function StatusBadge({ status }) {
  const styles = {
    applied: "bg-amber-100 text-amber-700",
    shortlisted: "bg-blue-100 text-blue-700",
    interview: "bg-emerald-100 text-emerald-700",
    hired: "bg-green-100 text-green-700",
    rejected: "bg-rose-100 text-rose-700",
  }
  return <span className={`rounded px-2 py-1 text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-700"}`}>{status}</span>
}

function RecruiterDashboard({ token }) {
  const [jobs, setJobs] = useState([])
  const [apps, setApps] = useState([])
  const [interviews, setInterviews] = useState([])
  const [logs, setLogs] = useState([])
  const [form, setForm] = useState({ title: "", description: "", location: "", salary: "", recruiter_email: "", required_skills: "python,fastapi" })
  const [statusForm, setStatusForm] = useState({ application_id: "", status: "shortlisted" })
  const [interviewForm, setInterviewForm] = useState({ application_id: "", interview_date: "", meeting_link: "", notes: "" })
  const [profile, setProfile] = useState({ company_name: "", recruiter_email: "" })

  const refresh = useMemo(() => async () => {
    const [jobList, appList, interviewList, emailList] = await Promise.all([
      apiRequest("/jobs", {}, token),
      apiRequest("/applications/recruiter", {}, token).catch(() => []),
      apiRequest("/interviews/recruiter", {}, token).catch(() => []),
      apiRequest("/emails/logs", {}, token).catch(() => []),
    ])
    setJobs(jobList)
    setApps(appList)
    setInterviews(interviewList)
    setLogs(emailList)
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().catch(() => {})
  }, [refresh])

  async function saveProfile(e) {
    e.preventDefault()
    await apiRequest("/recruiters/profile", { method: "POST", body: JSON.stringify(profile) }, token)
  }

  async function postJob(e) {
    e.preventDefault()
    await apiRequest("/jobs", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        salary: form.salary ? Number(form.salary) : null,
        required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    }, token)
    await refresh()
  }

  async function updateStatus(e) {
    e.preventDefault()
    await apiRequest(`/applications/${statusForm.application_id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: statusForm.status }),
    }, token)
    await refresh()
  }

  async function scheduleInterview(e) {
    e.preventDefault()
    await apiRequest("/interviews/schedule", {
      method: "POST",
      body: JSON.stringify(interviewForm),
    }, token)
    await refresh()
  }

  return (
    <section className="grid gap-6">
      <h2 className="text-2xl font-semibold">Recruiter Dashboard</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        <article className={cardClass}>
          <h3 className="mb-2 font-semibold">Recruiter Profile</h3>
          <form onSubmit={saveProfile} className="space-y-2">
            <input className={inputClass} placeholder="Company name" value={profile.company_name} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} />
            <input className={inputClass} placeholder="Recruiter email" value={profile.recruiter_email} onChange={(e) => setProfile({ ...profile, recruiter_email: e.target.value })} />
            <button className={buttonClass} type="submit">Save Profile</button>
          </form>
        </article>
        <article className={cardClass}>
          <h3 className="mb-2 font-semibold">Post Job</h3>
          <form onSubmit={postJob} className="space-y-2">
            <input className={inputClass} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className={inputClass} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input className={inputClass} placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <input className={inputClass} placeholder="Salary" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            <input className={inputClass} placeholder="Recruiter email" value={form.recruiter_email} onChange={(e) => setForm({ ...form, recruiter_email: e.target.value })} />
            <input className={inputClass} placeholder="skills comma separated" value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} />
            <button className={buttonClass} type="submit">Publish Job</button>
          </form>
        </article>
      </div>
      <article className={cardClass}>
        <h3 className="mb-2 font-semibold">Applicants</h3>
        <div className="mb-4 grid gap-2 text-sm">
          {apps.map((app) => <div key={app.application_id} className="rounded-lg border border-[#e2e6f6] p-2 dark:border-[#283056]">{app.candidate_name} - {app.job_title} - {app.status}</div>)}
        </div>
        <form onSubmit={updateStatus} className="grid gap-2 md:grid-cols-3">
          <input className={inputClass} placeholder="Application ID" value={statusForm.application_id} onChange={(e) => setStatusForm({ ...statusForm, application_id: e.target.value })} />
          <select className={inputClass} value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}>
            {["applied", "shortlisted", "interview", "hired", "rejected"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className={buttonClass}>Update Status</button>
        </form>
      </article>
      <article className={cardClass}>
        <h3 className="mb-2 font-semibold">Schedule Interview</h3>
        <form onSubmit={scheduleInterview} className="grid gap-2 md:grid-cols-4">
          <input className={inputClass} placeholder="Application ID" value={interviewForm.application_id} onChange={(e) => setInterviewForm({ ...interviewForm, application_id: e.target.value })} />
          <input className={inputClass} type="datetime-local" value={interviewForm.interview_date} onChange={(e) => setInterviewForm({ ...interviewForm, interview_date: e.target.value })} />
          <input className={inputClass} placeholder="Meeting link" value={interviewForm.meeting_link} onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })} />
          <input className={inputClass} placeholder="Notes" value={interviewForm.notes} onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })} />
          <button className={buttonClass} type="submit">Schedule</button>
        </form>
        <div className="mt-4 space-y-1 text-sm">
          {interviews.map((i) => <div key={i.id}>Interview #{i.id} - {new Date(i.interview_date).toLocaleString()}</div>)}
        </div>
      </article>
      <article className={cardClass}>
        <h3 className="mb-2 font-semibold">Email Automation Logs</h3>
        <div className="space-y-1 text-xs">
          {logs.slice(0, 20).map((log) => <div key={log.id}>{log.status} | {log.recipient} | {log.subject}</div>)}
        </div>
      </article>
      <article className={cardClass}>
        <h3 className="mb-2 font-semibold">Published Jobs</h3>
        <div className="space-y-1 text-sm">
          {jobs.map((job) => <div key={job.id}>{job.title} - {job.location || "N/A"}</div>)}
        </div>
      </article>
    </section>
  )
}

function AdminDashboard({ token }) {
  const [users, setUsers] = useState([])
  const [recruiters, setRecruiters] = useState([])
  const [jobs, setJobs] = useState([])
  const [emails, setEmails] = useState([])

  useEffect(() => {
    Promise.all([
      apiRequest("/admin/users", {}, token),
      apiRequest("/admin/recruiters", {}, token),
      apiRequest("/jobs", {}, token),
      apiRequest("/emails/logs", {}, token),
    ]).then(([u, r, j, e]) => {
      setUsers(u)
      setRecruiters(r)
      setJobs(j)
      setEmails(e)
    }).catch(() => {})
  }, [token])

  return (
    <section className="grid gap-6">
      <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Users" value={users.length} />
        <Metric label="Recruiters" value={recruiters.length} />
        <Metric label="Jobs" value={jobs.length} />
        <Metric label="Emails Logged" value={emails.length} />
      </div>
      <article className={cardClass}>
        <h3 className="mb-2 font-semibold">Users</h3>
        <div className="space-y-1 text-sm">{users.map((u) => <div key={u.id}>{u.full_name} ({u.role})</div>)}</div>
      </article>
      <article className={cardClass}>
        <h3 className="mb-2 font-semibold">Recruiters</h3>
        <div className="space-y-1 text-sm">{recruiters.map((r) => <div key={r.id}>{r.company_name} - {r.recruiter_email}</div>)}</div>
      </article>
    </section>
  )
}

function Metric({ label, value }) {
  return (
    <div className={`${cardClass} p-4`}>
      <p className="text-xs text-[#5f67a4]">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}

export default App
