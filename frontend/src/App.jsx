import { GoogleLogin } from "@react-oauth/google"
import { useEffect, useMemo, useState } from "react"
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom"
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

function getMatchBand(matchPercentage) {
  const score = Number(matchPercentage)
  if (!Number.isFinite(score)) {
    return {
      label: "Bad match",
      dotClass: "bg-rose-500",
      textClass: "text-rose-700 dark:text-rose-300",
    }
  }
  if (score >= 70) {
    return {
      label: "Good match",
      dotClass: "bg-emerald-500",
      textClass: "text-emerald-700 dark:text-emerald-300",
    }
  }
  if (score >= 40) {
    return {
      label: "Medium match",
      dotClass: "bg-amber-500",
      textClass: "text-amber-700 dark:text-amber-300",
    }
  }
  return {
    label: "Bad match",
    dotClass: "bg-rose-500",
    textClass: "text-rose-700 dark:text-rose-300",
  }
}

function evalMethodLabel(method) {
  if (method === "cosine_similarity") return "Cosine Similarity"
  if (method === "embedding_distance") return "Skill Overlap"
  return method
}

function MiniBarChart({ items, valueKey, labelKey, color = "#2563eb", max = 1 }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-sm text-[#65709a]">No chart data yet.</p>
  }
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const v = Number(item[valueKey] ?? 0)
        const pct = Math.max(0, Math.min(100, (v / max) * 100))
        return (
          <div key={String(item[labelKey])}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="truncate pr-2">{item[labelKey]}</span>
              <span>{v.toFixed(3)}</span>
            </div>
            <div className="h-2 rounded bg-[#e8ecfb] dark:bg-[#1c2747]">
              <div className="h-2 rounded" style={{ width: `${pct}%`, background: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ClusterScatter({ points, method }) {
  const scoped = (Array.isArray(points) ? points : []).filter((p) => p.method === method)
  if (scoped.length === 0) return <p className="text-sm text-[#65709a]">No chart data yet.</p>
  const nonCandidate = scoped.filter((p) => !p.is_candidate)
  const similarities = nonCandidate.map((p) => Math.max(0, Math.min(1, Number(p.candidate_cosine ?? 0))))
  const minSim = similarities.length ? Math.min(...similarities) : 0
  const maxSim = similarities.length ? Math.max(...similarities) : 1
  const span = Math.max(1e-6, maxSim - minSim)
  const palette = ["#2563eb", "#7c3aed", "#0d9488", "#d97706", "#dc2626", "#0891b2"]
  const seedAngle = (id) => ((Number(id) * 137.508) % 360) * (Math.PI / 180)
  return (
    <div className="relative h-64 w-full rounded-xl border border-[#d8dcef] bg-[#fafcff] dark:border-[#2d355c] dark:bg-[#101933]">
      {scoped.map((p, i) => {
        const angle = seedAngle(p.job_id || i + 1)
        const sim = Math.max(0, Math.min(1, Number(p.candidate_cosine ?? 0)))
        const normalized = p.is_candidate ? 1 : (sim - minSim) / span
        // Shared visual scale for both methods so graph comparison is fair.
        const radius = Math.max(0, 42 * Math.pow(1 - normalized, 0.72))
        const left = p.is_candidate ? 50 : 50 + radius * Math.cos(angle)
        const top = p.is_candidate ? 50 : 50 + radius * Math.sin(angle)
        const color = p.is_candidate ? "#22c55e" : palette[Math.abs(Number(p.cluster_label || 0)) % palette.length]
        const size = p.is_candidate ? 12 : 8
        return (
          <div
            key={`${p.job_id}-${i}`}
            title={p.title}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${left}%`, top: `${top}%`, width: `${size}px`, height: `${size}px`, background: color }}
          />
        )
      })}
      <div className="absolute bottom-2 right-2 text-[10px] text-[#65709a]">
        Green point = your skill vector ({method === "cosine_similarity" ? "higher cosine = closer" : "higher overlap = closer"})
      </div>
    </div>
  )
}

function CvScoreCard({ cvEval }) {
  if (!cvEval?.scores) return null
  const s = cvEval.scores
  const metrics = [
    { label: "Faithfulness", value: s.faithfulness },
    { label: "Relevance", value: s.relevance },
    { label: "Professionalism", value: s.professionalism },
    { label: "Completeness", value: s.completeness },
    { label: "Impact", value: s.impact },
  ]
  return (
    <div className="mt-3 rounded-xl border border-[#d8dcef] bg-[#f8faff] p-4 dark:border-[#2d355c] dark:bg-[#101933]">
      <p className="text-xs uppercase tracking-wide text-[#65709a]">Gemini CV Evaluation</p>
      <p className="mt-1 text-2xl font-semibold text-[#1a1f3c] dark:text-white">{Number(s.overall || 0).toFixed(1)} / 100</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-[#d6dcf0] px-3 py-2 text-sm dark:border-[#2d355c]">
            <span className="text-[#65709a]">{m.label}:</span> <span className="font-medium">{Number(m.value || 0).toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  )
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

/** Generic binary download with Bearer token (recruiter application attachments, etc.). */
async function downloadAuthenticatedBlob(path, token, fallbackFilename) {
  const headers = new Headers()
  if (token) headers.set("Authorization", `Bearer ${token}`)
  const response = await fetch(`${API_BASE}${path}`, { headers })
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
  let filename = fallbackFilename
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

function RecruiterStructuredCvPreview({ cvJson }) {
  if (!cvJson || typeof cvJson !== "object") {
    return <p className="text-sm text-[#65709a]">No structured CV attached.</p>
  }
  const header = cvJson.header || cvJson.personal_information || {}
  const name = header.name || header.full_name || "Candidate"
  const line2 = [header.email, header.phone, header.location].filter(Boolean).join(" · ")
  const sections = cvJson.sections || {}
  const order = Array.isArray(cvJson.section_order)
    ? cvJson.section_order
    : ["summary", "education", "skills", "experience", "projects", "certifications"]

  function sectionLabel(key) {
    return getSectionDisplayLabel(key, cvJson.section_labels || {})
  }

  function renderSectionBody(key) {
    const val = sections[key]
    if (key === "skills") {
      const list = Array.isArray(val) ? val : String(val || "").split(",").map((s) => s.trim()).filter(Boolean)
      if (list.length === 0) return <p className="text-sm text-[#65709a]">—</p>
      return (
        <div className="mt-2 flex flex-wrap gap-2">
          {list.map((skill) => (
            <span key={skill} className="rounded bg-[#e8edff] px-2 py-1 text-xs text-[#24408f] dark:bg-[#1e3a5f] dark:text-[#93c5fd]">
              {skill}
            </span>
          ))}
        </div>
      )
    }
    if (key === "summary") {
      return <p className="mt-1 whitespace-pre-line text-sm">{String(val || "").trim() || "—"}</p>
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return <p className="text-sm text-[#65709a]">—</p>
      return (
        <ul className="mt-1 list-disc space-y-2 pl-4 text-sm">
          {val.map((item, i) => (
            <li key={i} className="whitespace-pre-line">
              {typeof item === "string" ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      )
    }
    if (val && typeof val === "object") {
      return (
        <pre className="mt-1 max-h-48 overflow-auto rounded border border-[#e2e6f6] p-2 text-xs dark:border-[#283056]">
          {JSON.stringify(val, null, 2)}
        </pre>
      )
    }
    return <p className="mt-1 whitespace-pre-line text-sm">{String(val ?? "—")}</p>
  }

  return (
    <div className="rounded-xl border border-[#dbe2f7] p-4 dark:border-[#283056]">
      <h4 className="text-xl font-semibold text-[#1a1f3c] dark:text-white">{name}</h4>
      {line2 ? <p className="mt-1 text-sm text-[#5f67a4] dark:text-[#94a3b8]">{line2}</p> : null}
      <hr className="my-3 border-[#dbe2f7] dark:border-[#283056]" />
      {order.map((key) => (
        <div key={key} className="mt-3 border-t border-[#eef2ff] pt-3 first:mt-0 first:border-t-0 first:pt-0 dark:border-[#283056]">
          <h5 className="text-sm font-semibold text-[#1a1f3c] dark:text-white">{sectionLabel(key)}</h5>
          {renderSectionBody(key)}
        </div>
      ))}
    </div>
  )
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

function MarketingLayout({ user, setToken }) {
  const location = useLocation()
  const authLayout = AUTH_LAYOUT_PATHS.has(location.pathname)
  const { isDark, toggleTheme } = useTheme()
  return (
    <>
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
        <Outlet />
      </main>
    </>
  )
}

function AppSessionLoading() {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center gap-2 bg-[#f4f6fb] text-[#161a2f] dark:bg-[#0a1022] dark:text-[#e8edff]">
      <p className="text-sm font-medium text-[#374151] dark:text-[#cbd5e1]">Loading your session…</p>
      <p className="text-xs text-[#65709a]">Please wait</p>
    </div>
  )
}

function AppWorkspace({ user, token, setToken }) {
  const { isDark, toggleTheme } = useTheme()
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f4f6fb] text-[#161a2f] dark:bg-[#0a1022] dark:text-[#e8edff]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#d8dcef] bg-white/90 px-4 py-3 backdrop-blur-sm dark:border-[#1e293b] dark:bg-[#0f172a]/95 sm:px-6">
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
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden px-3 pb-3 pt-2 sm:px-4">
        <RoleRouter user={user} token={token} />
      </div>
    </div>
  )
}

function readStoredToken() {
  return localStorage.getItem("hirebee-token") ?? sessionStorage.getItem("hirebee-token") ?? ""
}

function App() {
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
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage setToken={setToken} googleClientId={googleClientId} />} />
          <Route path="/register" element={<RegisterPage setToken={setToken} googleClientId={googleClientId} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Routes>
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
    { key: "evaluation", label: "Evaluation" },
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
  const [evalData, setEvalData] = useState({ metrics: [], points: [] })
  const [cvEval, setCvEval] = useState(null)
  const [runningEval, setRunningEval] = useState(false)
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
    const [jobList, matchList, appList, cvList, letterList, evalRes] = await Promise.all([
      apiRequest("/jobs", {}, token),
      apiRequest("/matching/jobs-for-me", {}, token).catch(() => []),
      apiRequest("/applications/me", {}, token),
      apiRequest("/cvs", {}, token),
      apiRequest("/cover-letters", {}, token),
      apiRequest("/evaluation/jobs/for-me", {}, token).catch(() => ({ metrics: [], points: [] })),
    ])
    setJobs(jobList)
    setMatches(matchList)
    setApps(appList)
    setCvs(cvList)
    setLetters(letterList)
    setEvalData(evalRes)
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

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
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
  /* eslint-enable react-hooks/set-state-in-effect */

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
      if (cv.cv_quality_score != null) {
        const latest = await apiRequest(`/evaluation/cv/latest/${id}`, {}, token).catch(() => null)
        setCvEval(latest)
      } else {
        setCvEval(null)
      }
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

  async function runSeekerEvaluation() {
    setRunningEval(true)
    setError("")
    setMessage("")
    try {
      await apiRequest("/evaluation/jobs/run", { method: "POST", body: JSON.stringify({ k: 4, top_k: 5, cosine_threshold: 0.75 }) }, token)
      const next = await apiRequest("/evaluation/jobs/for-me", {}, token).catch(() => ({ metrics: [], points: [] }))
      setEvalData(next)
      setMessage("Evaluation rerun complete.")
    } catch (err) {
      setError(err.message)
    } finally {
      setRunningEval(false)
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
    <section className="flex h-full min-h-0 w-full flex-col gap-4 lg:flex-row lg:gap-4">
      <aside className="flex max-h-[min(40vh,320px)] shrink-0 flex-col overflow-y-auto rounded-2xl border border-[#182742] bg-[#0f1d35] p-4 text-white dark:border-[#1f2d4d] lg:max-h-none lg:h-full lg:min-h-0 lg:w-[220px]">
        <div className="border-b border-[#223559] pb-4">
          <p className="text-xs uppercase tracking-wider text-[#9db6df]">HireBee</p>
          <p className="mt-1 text-lg font-semibold">Job Seeker</p>
        </div>
        <nav className="mt-4 grid gap-1">
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
        </nav>
        <div className="mt-8 border-t border-[#223559] pt-3 text-xs text-[#8ca8d8]">
          Theme: {isDark ? "Dark" : "Light"}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          className={`flex min-h-0 flex-1 flex-col gap-4 pr-1 ${activePage === "cv" ? "overflow-hidden" : "overflow-y-auto"}`}
        >
        {message && <p className="shrink-0 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="shrink-0 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

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
          <section className="flex min-h-0 flex-1 shrink-0 flex-col gap-4 overflow-hidden">
          <article className={`${cardClass} shrink-0`}>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setCvMode("manual")} className={`rounded-xl px-3 py-2 text-sm ${cvMode === "manual" ? "bg-[#2a2354] text-white" : "border border-[#c9cce5] dark:border-[#303a63]"}`}>Manual CV Generator</button>
              <button type="button" onClick={() => setCvMode("conversational")} className={`rounded-xl px-3 py-2 text-sm ${cvMode === "conversational" ? "bg-[#2a2354] text-white" : "border border-[#c9cce5] dark:border-[#303a63]"}`}>Conversational CV Generator</button>
            </div>
          </article>

          {cvMode === "manual" ? (
            <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <article className={`${cardClass} flex min-h-0 flex-col overflow-hidden`}>
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
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
                </div>
              </article>
              <article className={`${cardClass} flex min-h-0 flex-col overflow-hidden`}>
                <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
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
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
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
                </div>
              </article>
            </div>
          ) : (
            <article className={`${cardClass} flex min-h-0 flex-1 flex-col overflow-hidden`}>
              <div className="flex min-h-0 flex-1 flex-col space-y-3 overflow-y-auto pr-1">
              <h3 className="mb-3 font-semibold">Conversational CV Generator</h3>
              <p className="mb-2 text-sm text-[#65709a]">
                Chat naturally with the coach, then generate your CV. PDF is exported to your device after generation (same as manual flow).
              </p>
              <div className="min-h-[12rem] flex-1 space-y-2 overflow-y-auto rounded-xl border border-[#d9deef] bg-[#f8f9ff] p-3 dark:border-[#2f3862] dark:bg-[#10162d]">
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
              <CvScoreCard cvEval={cvEval} />
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

        {activePage === "evaluation" && (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <article className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-2xl font-semibold">Recommendation Evaluation</h3>
                <button className={buttonClass} type="button" onClick={runSeekerEvaluation} disabled={runningEval}>
                  {runningEval ? "Running..." : "Run Evaluation"}
                </button>
              </div>
              <p className="mt-1 text-sm text-[#65709a]">Latest runs comparing cosine semantic similarity vs literal skill-overlap similarity.</p>
              {evalData.metrics.length === 0 ? (
                <p className="mt-4 text-sm text-[#65709a]">No evaluation runs yet. Click Run Evaluation to generate results.</p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {evalData.metrics.map((m) => (
                    <div key={m.run_id} className="rounded-xl border border-[#d8dcef] p-3 text-sm dark:border-[#2d355c]">
                      <p className="font-semibold">{evalMethodLabel(m.method)}</p>
                      {(() => {
                        const pts = (evalData.points || []).filter((p) => p.method === m.method && !p.is_candidate)
                        const avg = pts.length ? pts.reduce((acc, p) => acc + Number(p.candidate_cosine || 0), 0) / pts.length : 0
                        const high = pts.filter((p) => Number(p.candidate_cosine || 0) >= 0.6).length
                        return (
                          <p className="mt-1 text-[#65709a]">
                            Avg similarity {(avg * 100).toFixed(1)}% · Jobs &gt;= 60%: {high}/{pts.length}
                          </p>
                        )
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </article>
            <article className={cardClass}>
              <h4 className="font-semibold">Run Comparison Graph</h4>
              <div className="mt-3">
                <MiniBarChart
                  items={(evalData.metrics || []).map((m) => {
                    const pts = (evalData.points || []).filter((p) => p.method === m.method && !p.is_candidate)
                    const avg = pts.length ? pts.reduce((acc, p) => acc + Number(p.candidate_cosine || 0), 0) / pts.length : 0
                    return { ...m, method_label: evalMethodLabel(m.method), avg_similarity: avg }
                  })}
                  valueKey="avg_similarity"
                  labelKey="method_label"
                  max={1}
                />
              </div>
            </article>
            <article className={cardClass}>
              <h4 className="font-semibold">Cosine Similarity Graph (You vs Jobs)</h4>
              <div className="mt-3">
                <ClusterScatter points={evalData.points} method="cosine_similarity" />
              </div>
            </article>
            <article className={cardClass}>
              <h4 className="font-semibold">Skill Overlap Graph (You vs Jobs)</h4>
              <div className="mt-3">
                <ClusterScatter points={evalData.points} method="embedding_distance" />
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
      </div>
    </section>
  )
}

function StatusBadge({ status }) {
  const styles = {
    applied: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    shortlisted: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    interview: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    hired: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    rejected: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  }
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${styles[status] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
      {status}
    </span>
  )
}

const RECRUITER_STATUS_OPTIONS = ["applied", "shortlisted", "interview", "hired", "rejected"]

function RecruiterDashboard({ token, user }) {
  const { isDark } = useTheme()
  const navItems = [
    { key: "overview", label: "Overview" },
    { key: "jobs", label: "Jobs" },
    { key: "applicants", label: "Applicants" },
    { key: "interviews", label: "Interviews" },
    { key: "emails", label: "Email logs" },
    { key: "profile", label: "Company" },
  ]
  const [activePage, setActivePage] = useState("overview")
  const [jobs, setJobs] = useState([])
  const [apps, setApps] = useState([])
  const [interviews, setInterviews] = useState([])
  const [logs, setLogs] = useState([])
  const [recruiterMeta, setRecruiterMeta] = useState(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState({ refresh: false, profile: false, job: false, interview: false, status: {} })
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    salary: "",
    recruiter_email: user?.email ?? "",
    required_skills: "python, fastapi, postgresql",
  })
  const [interviewForm, setInterviewForm] = useState({ application_id: "", interview_date: "", meeting_link: "", notes: "" })
  const [profile, setProfile] = useState({ company_name: "", recruiter_email: user?.email ?? "" })
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [appDetail, setAppDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const myJobs = useMemo(() => {
    const email = (recruiterMeta?.recruiter_email || user?.email || "").toLowerCase()
    if (!email) return jobs
    return jobs.filter((j) => (j.recruiter_email || "").toLowerCase() === email)
  }, [jobs, recruiterMeta, user])

  const refresh = useMemo(() => async () => {
    setLoading((p) => ({ ...p, refresh: true }))
    setError("")
    try {
      const [jobList, appList, interviewList, emailList, profileRes] = await Promise.all([
        apiRequest("/jobs", {}, token),
        apiRequest("/applications/recruiter", {}, token).catch(() => []),
        apiRequest("/interviews/recruiter", {}, token).catch(() => []),
        apiRequest("/emails/logs", {}, token).catch(() => []),
        apiRequest("/recruiters/profile", {}, token).catch(() => null),
      ])
      setJobs(jobList)
      setApps(appList)
      setInterviews(interviewList)
      setLogs(emailList)
      setRecruiterMeta(profileRes)
      if (profileRes) {
        setProfile({ company_name: profileRes.company_name || "", recruiter_email: profileRes.recruiter_email || "" })
        setForm((f) => ({ ...f, recruiter_email: profileRes.recruiter_email || f.recruiter_email }))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((p) => ({ ...p, refresh: false }))
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().catch(() => {})
  }, [refresh])

  async function saveProfile(e) {
    e.preventDefault()
    setLoading((p) => ({ ...p, profile: true }))
    setError("")
    setMessage("")
    try {
      await apiRequest("/recruiters/profile", { method: "POST", body: JSON.stringify(profile) }, token)
      setMessage("Company profile saved.")
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((p) => ({ ...p, profile: false }))
    }
  }

  async function postJob(e) {
    e.preventDefault()
    setLoading((p) => ({ ...p, job: true }))
    setError("")
    setMessage("")
    try {
      await apiRequest("/jobs", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          salary: form.salary ? Number(form.salary) : null,
          required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      }, token)
      setMessage("Job published and skills indexed for matching.")
      setForm((f) => ({ ...f, title: "", description: "", location: "", salary: "" }))
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((p) => ({ ...p, job: false }))
    }
  }

  async function updateApplicationStatus(applicationId, status) {
    setLoading((p) => ({ ...p, status: { ...p.status, [applicationId]: true } }))
    setError("")
    setMessage("")
    try {
      await apiRequest(`/applications/${applicationId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, token)
      setMessage("Application status updated.")
      await refresh()
      if (detailOpen && detailId === applicationId) {
        const d = await apiRequest(`/applications/recruiter/${applicationId}/detail`, {}, token)
        setAppDetail(d)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((p) => ({ ...p, status: { ...p.status, [applicationId]: false } }))
    }
  }

  async function scheduleInterview(e) {
    e.preventDefault()
    setLoading((p) => ({ ...p, interview: true }))
    setError("")
    setMessage("")
    const aid = Number(interviewForm.application_id)
    if (!aid || Number.isNaN(aid)) {
      setError("Choose an application from the list.")
      setLoading((p) => ({ ...p, interview: false }))
      return
    }
    if (!interviewForm.interview_date || !interviewForm.meeting_link?.trim()) {
      setError("Set interview date/time and meeting link.")
      setLoading((p) => ({ ...p, interview: false }))
      return
    }
    try {
      await apiRequest("/interviews/schedule", {
        method: "POST",
        body: JSON.stringify({
          application_id: aid,
          interview_date: new Date(interviewForm.interview_date).toISOString(),
          meeting_link: interviewForm.meeting_link.trim(),
          notes: interviewForm.notes?.trim() || null,
        }),
      }, token)
      setMessage("Interview scheduled and candidate notified (if SMTP is configured).")
      setInterviewForm({ application_id: "", interview_date: "", meeting_link: "", notes: "" })
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading((p) => ({ ...p, interview: false }))
    }
  }

  const interviewAppLabel = (a) => `#${a.application_id} · ${a.candidate_name} · ${a.job_title}`

  function closeApplicantDetail() {
    setDetailOpen(false)
    setDetailId(null)
    setAppDetail(null)
    setDetailLoading(false)
  }

  async function openApplicantDetail(applicationId) {
    setDetailId(applicationId)
    setDetailOpen(true)
    setDetailLoading(true)
    setAppDetail(null)
    setError("")
    try {
      const d = await apiRequest(`/applications/recruiter/${applicationId}/detail`, {}, token)
      setAppDetail(d)
    } catch (err) {
      setError(err.message)
      closeApplicantDetail()
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <>
    <section className="flex h-full min-h-0 w-full flex-col gap-4 lg:flex-row lg:gap-4">
      <aside className="flex max-h-[min(40vh,320px)] shrink-0 flex-col overflow-y-auto rounded-2xl border border-[#182742] bg-[#0f1d35] p-4 text-white dark:border-[#1f2d4d] lg:max-h-none lg:h-full lg:min-h-0 lg:w-[220px]">
        <div className="border-b border-[#223559] pb-4">
          <p className="text-xs uppercase tracking-wider text-[#9db6df]">HireBee</p>
          <p className="mt-1 text-lg font-semibold">Recruiter</p>
          <p className="mt-1 truncate text-xs text-[#8ca8d8]">{recruiterMeta?.company_name || "Your workspace"}</p>
        </div>
        <nav className="mt-4 grid gap-1">
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
        </nav>
        <div className="mt-8 border-t border-[#223559] pt-3 text-xs text-[#8ca8d8]">
          Theme: {isDark ? "Dark" : "Light"}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {message && <p className="shrink-0 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{message}</p>}
        {error && <p className="shrink-0 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}

        {activePage === "overview" && (
          <section className="grid gap-4">
            <div className="rounded-2xl border border-[#d8dcef] bg-gradient-to-br from-[#f8f9ff] to-white p-6 dark:border-[#2d355c] dark:from-[#121831] dark:to-[#0f1428]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#5f67a4] dark:text-[#94a3b8]">Welcome back</p>
              <h2 className="mt-1 text-2xl font-semibold text-[#1a1f3c] dark:text-white">{user?.full_name || "Recruiter"}</h2>
              <p className="mt-2 max-w-2xl text-sm text-[#4a5070] dark:text-[#aeb7df]">
                Review applicants, move pipelines forward, and publish roles. Matches the HireBee recruiter workspace layout (sidebar + cards).
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <Metric label="Open roles" value={myJobs.length} />
              <Metric label="Applicants" value={apps.length} />
              <Metric label="Interviews" value={interviews.length} />
              <Metric label="Emails logged" value={logs.length} />
            </div>
            <article className={cardClass}>
              <h3 className="mb-3 font-semibold">Quick actions</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <button type="button" onClick={() => setActivePage("jobs")} className="rounded-xl border border-[#dbe2f7] p-4 text-left transition hover:bg-[#f2f5ff] dark:border-[#283056] dark:hover:bg-[#151f3a]">
                  <p className="font-semibold text-[#1a1f3c] dark:text-white">Post a job</p>
                  <p className="text-xs text-[#65709a]">Title, description, required skills</p>
                </button>
                <button type="button" onClick={() => setActivePage("applicants")} className="rounded-xl border border-[#dbe2f7] p-4 text-left transition hover:bg-[#f2f5ff] dark:border-[#283056] dark:hover:bg-[#151f3a]">
                  <p className="font-semibold text-[#1a1f3c] dark:text-white">Review applicants</p>
                  <p className="text-xs text-[#65709a]">Status and skill match</p>
                </button>
                <button type="button" onClick={() => setActivePage("interviews")} className="rounded-xl border border-[#dbe2f7] p-4 text-left transition hover:bg-[#f2f5ff] dark:border-[#283056] dark:hover:bg-[#151f3a]">
                  <p className="font-semibold text-[#1a1f3c] dark:text-white">Schedule interviews</p>
                  <p className="text-xs text-[#65709a]">Link candidates to calendar</p>
                </button>
              </div>
            </article>
          </section>
        )}

        {activePage === "jobs" && (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <article className={cardClass}>
              <h3 className="mb-1 font-semibold">Your listings</h3>
              <p className="mb-4 text-xs text-[#65709a]">Filtered by recruiter email on the job record.</p>
              <div className="max-h-[28rem] space-y-2 overflow-auto">
                {myJobs.length === 0 && <p className="text-sm text-[#65709a]">No jobs yet — create your recruiter profile (Company) then publish a role.</p>}
                {myJobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-[#e2e6f6] p-3 text-sm dark:border-[#283056]">
                    <p className="font-semibold text-[#1a1f3c] dark:text-white">{job.title}</p>
                    <p className="text-xs text-[#65709a]">{job.location || "Remote"} · {job.salary != null ? `$${Number(job.salary).toLocaleString()}` : "Salary TBD"}</p>
                    {job.required_skills?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {job.required_skills.map((s) => (
                          <span key={s} className="rounded bg-[#e8edff] px-2 py-0.5 text-xs text-[#24408f] dark:bg-[#1e3a5f] dark:text-[#93c5fd]">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
            <article className={cardClass}>
              <h3 className="mb-1 font-semibold">Publish new role</h3>
              <p className="mb-4 text-xs text-[#65709a]">Required skills are normalized for ATS matching and Qdrant indexing.</p>
              <form onSubmit={postJob} className="grid gap-3">
                <input className={inputClass} placeholder="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <textarea className={`${inputClass} min-h-[100px]`} placeholder="Role description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className={inputClass} placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  <input className={inputClass} placeholder="Annual salary (number)" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
                </div>
                <input className={inputClass} placeholder="Contact email on listing" value={form.recruiter_email} onChange={(e) => setForm({ ...form, recruiter_email: e.target.value })} required />
                <input className={inputClass} placeholder="Required skills (comma separated)" value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} />
                <button className={buttonClass} type="submit" disabled={loading.job}>
                  {loading.job ? "Publishing…" : "Publish job"}
                </button>
              </form>
            </article>
          </section>
        )}

        {activePage === "applicants" && (
          <article className={cardClass}>
            <h3 className="mb-1 font-semibold">Applicants</h3>
            <p className="mb-4 text-xs text-[#65709a]">Click a candidate to open cover letter and CV. Use the status menu without clicking the card body.</p>
            <div className="space-y-3">
              {apps.length === 0 && <p className="text-sm text-[#65709a]">No applications to your jobs yet.</p>}
              {apps.map((app) => (
                <div
                  key={app.application_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openApplicantDetail(app.application_id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      openApplicantDetail(app.application_id)
                    }
                  }}
                  className="cursor-pointer rounded-xl border border-[#e2e6f6] p-4 transition hover:border-[#93b4ff] hover:bg-[#f8f9ff] dark:border-[#283056] dark:hover:border-[#3b4f8a] dark:hover:bg-[#151f3a]"
                >
                  {(() => {
                    const badge = getMatchBand(app.match_percentage)
                    return (
                      <div className={`mb-2 flex items-center justify-end gap-2 text-xs font-semibold ${badge.textClass}`}>
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${badge.dotClass}`} />
                        <span>{badge.label}</span>
                      </div>
                    )
                  })()}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#1a1f3c] dark:text-white">{app.candidate_name}</p>
                      <p className="text-xs text-[#65709a]">{app.candidate_email}</p>
                      <p className="mt-1 text-sm text-[#374151] dark:text-[#cbd5e1]">{app.job_title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={app.status} />
                        {app.match_percentage != null && Number.isFinite(app.match_percentage) && (
                          <span className="rounded-md bg-[#eef2ff] px-2 py-0.5 text-xs font-medium text-[#3730a3] dark:bg-[#312e81] dark:text-[#c7d2fe]">
                            {Math.round(app.match_percentage)}% skills match
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <select
                        className={inputClass}
                        value={app.status}
                        onChange={(e) => updateApplicationStatus(app.application_id, e.target.value)}
                        disabled={loading.status[app.application_id]}
                      >
                        {RECRUITER_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {(app.matched_skills?.length > 0 || app.missing_skills?.length > 0) && (
                    <div className="mt-3 flex flex-wrap gap-4 border-t border-[#eef2ff] pt-3 text-xs dark:border-[#283056]">
                      {app.matched_skills?.length > 0 && (
                        <div>
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">Matched</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {app.matched_skills.map((s) => (
                              <span key={s} className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {app.missing_skills?.length > 0 && (
                        <div>
                          <span className="font-semibold text-rose-700 dark:text-rose-400">Missing</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {app.missing_skills.map((s) => (
                              <span key={s} className="rounded bg-rose-50 px-2 py-0.5 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </article>
        )}

        {activePage === "interviews" && (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <article className={cardClass}>
              <h3 className="mb-1 font-semibold">Upcoming</h3>
              <p className="mb-4 text-xs text-[#65709a]">Scheduled interviews for your roles.</p>
              <div className="max-h-[24rem] space-y-2 overflow-auto text-sm">
                {interviews.length === 0 && <p className="text-[#65709a]">No interviews scheduled.</p>}
                {interviews.map((inv) => (
                  <div key={inv.id} className="rounded-xl border border-[#e2e6f6] p-3 dark:border-[#283056]">
                    <p className="font-medium text-[#1a1f3c] dark:text-white">{new Date(inv.interview_date).toLocaleString()}</p>
                    <p className="mt-1 break-all text-xs text-[#2563eb] dark:text-[#93c5fd]">{inv.meeting_link}</p>
                    {inv.notes && <p className="mt-1 text-xs text-[#65709a]">{inv.notes}</p>}
                    <p className="mt-1 text-xs text-[#94a3b8]">Application #{inv.application_id}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className={cardClass}>
              <h3 className="mb-1 font-semibold">Schedule interview</h3>
              <p className="mb-4 text-xs text-[#65709a]">Sets application status to interview and emails the candidate when SMTP is configured.</p>
              <form onSubmit={scheduleInterview} className="grid gap-3">
                <label className="text-xs font-medium text-[#5f67a4] dark:text-[#94a3b8]">Application</label>
                <select
                  className={inputClass}
                  value={interviewForm.application_id}
                  onChange={(e) => setInterviewForm({ ...interviewForm, application_id: e.target.value })}
                >
                  <option value="">Select application…</option>
                  {apps.map((a) => (
                    <option key={a.application_id} value={a.application_id}>
                      {interviewAppLabel(a)}
                    </option>
                  ))}
                </select>
                <label className="text-xs font-medium text-[#5f67a4] dark:text-[#94a3b8]">Date & time</label>
                <input className={inputClass} type="datetime-local" value={interviewForm.interview_date} onChange={(e) => setInterviewForm({ ...interviewForm, interview_date: e.target.value })} />
                <input className={inputClass} placeholder="Meeting link (Zoom, Meet, …)" value={interviewForm.meeting_link} onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })} />
                <input className={inputClass} placeholder="Notes (optional)" value={interviewForm.notes} onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })} />
                <button className={buttonClass} type="submit" disabled={loading.interview}>
                  {loading.interview ? "Scheduling…" : "Schedule interview"}
                </button>
              </form>
            </article>
          </section>
        )}

        {activePage === "emails" && (
          <article className={cardClass}>
            <h3 className="mb-1 font-semibold">Email automation</h3>
            <p className="mb-4 text-xs text-[#65709a]">Recent platform sends (applications, interviews, password reset).</p>
            <div className="overflow-x-auto rounded-xl border border-[#e2e6f6] dark:border-[#283056]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-[#e2e6f6] bg-[#f8f9ff] text-xs font-semibold uppercase text-[#5f67a4] dark:border-[#283056] dark:bg-[#151f3a] dark:text-[#94a3b8]">
                  <tr>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Recipient</th>
                    <th className="px-3 py-2">Subject</th>
                    <th className="px-3 py-2">When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 40).map((log) => (
                    <tr key={log.id} className="border-b border-[#f1f4fc] last:border-0 dark:border-[#1e293b]">
                      <td className="px-3 py-2 font-medium">{log.status}</td>
                      <td className="px-3 py-2 text-[#65709a]">{log.recipient}</td>
                      <td className="px-3 py-2">{log.subject}</td>
                      <td className="px-3 py-2 text-xs text-[#65709a]">{log.created_at ? new Date(log.created_at).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && <p className="p-4 text-sm text-[#65709a]">No email rows yet.</p>}
            </div>
          </article>
        )}

        {activePage === "profile" && (
          <article className={`${cardClass} max-w-xl`}>
            <h3 className="mb-1 font-semibold">Company profile</h3>
            <p className="mb-4 text-xs text-[#65709a]">Create once via API; if you already have a profile, saving again may return an error — use the same email as on your job posts.</p>
            <form onSubmit={saveProfile} className="grid gap-3">
              <input className={inputClass} placeholder="Company name" value={profile.company_name} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} required />
              <input className={inputClass} placeholder="Recruiting contact email" value={profile.recruiter_email} onChange={(e) => setProfile({ ...profile, recruiter_email: e.target.value })} required />
              <button className={buttonClass} type="submit" disabled={loading.profile}>
                {loading.profile ? "Saving…" : recruiterMeta ? "Update (re-create if blocked)" : "Create profile"}
              </button>
            </form>
          </article>
        )}
        </div>
      </div>
    </section>

    {detailOpen && (
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/45 p-0 sm:p-4"
        role="presentation"
        onClick={closeApplicantDetail}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="applicant-detail-title"
          className="flex h-full w-full max-w-lg flex-col border-l border-[#d8dcef] bg-white shadow-2xl dark:border-[#2d355c] dark:bg-[#121831] sm:max-w-xl sm:rounded-l-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e2e6f6] px-4 py-3 dark:border-[#283056]">
            <h3 id="applicant-detail-title" className="text-lg font-semibold text-[#1a1f3c] dark:text-white">
              {detailId != null ? `Application #${detailId}` : "Application"}
            </h3>
            <button
              type="button"
              className="rounded-lg border border-[#c9cce5] px-3 py-1.5 text-sm dark:border-[#303a63]"
              onClick={closeApplicantDetail}
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {detailLoading && <p className="text-sm text-[#65709a]">Loading application…</p>}
            {!detailLoading && appDetail && (
              <>
                <div>
                  <p className="text-sm font-semibold text-[#1a1f3c] dark:text-white">{appDetail.candidate_name}</p>
                  <p className="text-xs text-[#65709a]">{appDetail.candidate_email}</p>
                  <p className="mt-2 text-sm text-[#374151] dark:text-[#cbd5e1]">{appDetail.job_title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={appDetail.status} />
                    <select
                      className={`${inputClass} w-auto min-w-[9rem]`}
                      value={appDetail.status}
                      onChange={(e) => updateApplicationStatus(appDetail.application_id, e.target.value)}
                      disabled={loading.status[appDetail.application_id]}
                    >
                      {RECRUITER_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-[#eef2ff] pt-4 dark:border-[#283056]">
                  {appDetail.resume?.id != null && (
                    <button
                      type="button"
                      className="rounded-lg border border-[#2563eb] bg-white px-3 py-1.5 text-xs font-semibold text-[#2563eb] dark:border-[#60a5fa] dark:bg-[#1e293b] dark:text-[#93c5fd]"
                      onClick={() =>
                        downloadAuthenticatedBlob(
                          `/applications/recruiter/${appDetail.application_id}/resume-file`,
                          token,
                          appDetail.resume?.file_name || "resume",
                        ).catch((err) => setError(err.message))
                      }
                    >
                      Download resume file
                    </button>
                  )}
                  {appDetail.generated_cv?.has_pdf && (
                    <button
                      type="button"
                      className="rounded-lg border border-[#2563eb] bg-white px-3 py-1.5 text-xs font-semibold text-[#2563eb] dark:border-[#60a5fa] dark:bg-[#1e293b] dark:text-[#93c5fd]"
                      onClick={() =>
                        downloadAuthenticatedBlob(
                          `/applications/recruiter/${appDetail.application_id}/cv-download?export_format=pdf`,
                          token,
                          "cv.pdf",
                        ).catch((err) => setError(err.message))
                      }
                    >
                      Download CV (PDF)
                    </button>
                  )}
                  {appDetail.generated_cv?.has_docx && (
                    <button
                      type="button"
                      className="rounded-lg border border-[#2563eb] bg-white px-3 py-1.5 text-xs font-semibold text-[#2563eb] dark:border-[#60a5fa] dark:bg-[#1e293b] dark:text-[#93c5fd]"
                      onClick={() =>
                        downloadAuthenticatedBlob(
                          `/applications/recruiter/${appDetail.application_id}/cv-download?export_format=docx`,
                          token,
                          "cv.docx",
                        ).catch((err) => setError(err.message))
                      }
                    >
                      Download CV (DOCX)
                    </button>
                  )}
                </div>
                {appDetail.cover_letter?.content != null && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#1a1f3c] dark:text-white">Cover letter</h4>
                    <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-[#e2e6f6] bg-[#f8f9ff] p-3 text-sm whitespace-pre-wrap dark:border-[#283056] dark:bg-[#10162d]">
                      {appDetail.cover_letter.content}
                    </div>
                  </div>
                )}
                {appDetail.generated_cv?.cv_json && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#1a1f3c] dark:text-white">
                      CV preview{appDetail.generated_cv.title ? ` — ${appDetail.generated_cv.title}` : ""}
                    </h4>
                    <div className="mt-2 max-h-[min(60vh,28rem)] overflow-y-auto">
                      <RecruiterStructuredCvPreview cvJson={appDetail.generated_cv.cv_json} />
                    </div>
                  </div>
                )}
                {appDetail.resume?.parsed_data && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#1a1f3c] dark:text-white">Parsed resume snapshot</h4>
                    <p className="mt-1 text-sm text-[#374151] dark:text-[#cbd5e1]">
                      {appDetail.resume.parsed_data?.summary || appDetail.resume.parsed_data?.name || "Parsed fields available in export."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )}
    </>
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
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
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
      </div>
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
