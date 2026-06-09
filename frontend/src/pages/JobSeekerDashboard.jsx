import { useEffect, useMemo, useRef, useState } from "react"
import { useTheme } from "../context/ThemeContext.jsx"
import { apiRequest, downloadCvExport } from "../lib/api.js"
import { formatJobMatchLabel, evalMethodLabel } from "../lib/matching.js"
import {
  buildManualCvJson,
  CORE_CV_SECTION_KEYS,
  DEFAULT_CV_SECTION_ORDER,
  getSectionDisplayLabel,
  safeExternalUrl,
  SECTION_PRESET_OPTIONS,
  slugCustomSectionKey,
} from "../lib/cv.js"
import { cardClass, inputClass, buttonClass, buttonGhostClass } from "../styles/uiClasses.js"
import { MiniBarChart } from "../components/charts/MiniBarChart.jsx"
import { ClusterScatter } from "../components/charts/ClusterScatter.jsx"
import { CvScoreCard } from "../components/cv/CvScoreCard.jsx"
import { Metric } from "../components/Metric.jsx"
import { StatusBadge } from "../components/StatusBadge.jsx"

export function JobSeekerDashboard({ token, user }) {
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
  const chatStorageKey = useMemo(() => (user?.id ? `hirebee:cvChat:${user.id}` : null), [user?.id])
  const defaultChatOpening = useMemo(
    () => ({
      role: "assistant",
      content: "Hi! I'm here to help you build a strong CV. What roles are you targeting, and what's a quick overview of your background so far?",
    }),
    [],
  )
  const [convoMessages, setConvoMessages] = useState(() => {
    if (typeof window === "undefined") return [defaultChatOpening]
    try {
      const key = user?.id ? `hirebee:cvChat:${user.id}` : null
      if (!key) return [defaultChatOpening]
      const cached = window.localStorage.getItem(key)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      /* ignore */
    }
    return [defaultChatOpening]
  })
  const [convoInput, setConvoInput] = useState("")
  const chatEndRef = useRef(null)
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
    const [jobList, matchList, appList, cvList, letterList, evalRes, convoHistory] = await Promise.all([
      apiRequest("/jobs", {}, token),
      apiRequest("/matching/jobs-for-me", {}, token).catch(() => []),
      apiRequest("/applications/me", {}, token),
      apiRequest("/cvs", {}, token),
      apiRequest("/cover-letters", {}, token),
      apiRequest("/evaluation/jobs/for-me", {}, token).catch(() => ({ metrics: [], points: [] })),
      apiRequest("/cvs/conversation/history", {}, token).catch(() => null),
    ])
    setJobs(jobList)
    setMatches(matchList)
    setApps(appList)
    setCvs(cvList)
    setLetters(letterList)
    setEvalData(evalRes)
    if (convoHistory?.messages?.length) {
      setConvoMessages((prev) => {
        const incoming = convoHistory.messages
        if (Array.isArray(prev) && prev.length > incoming.length) {
          return prev
        }
        return incoming
      })
    }
    setCvEval(convoHistory?.latest_cv_evaluation || null)
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
    if (!chatStorageKey || typeof window === "undefined") return
    try {
      window.localStorage.setItem(chatStorageKey, JSON.stringify(convoMessages))
    } catch {
      /* quota or serialization failure — ignore */
    }
  }, [chatStorageKey, convoMessages])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [convoMessages, loading.convoChat])

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

  useEffect(() => {
    if (!token || !selectedCvId) return;
    let cancelled = false;
    apiRequest("/cvs/conversation/history", {}, token)
      .then((history) => {
        if (cancelled) return;
        if (history?.latest_cv_evaluation) {
          setCvEval(history.latest_cv_evaluation);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, selectedCvId])
  /* eslint-enable react-hooks/set-state-in-effect */

  const evalSummaryByRun = useMemo(() => {
    const out = {}
    const points = evalData.points || []
    ;(evalData.metrics || []).forEach((m) => {
      const pts = points.filter((p) => p.method === m.method && p.run_id === m.run_id && !p.is_candidate)
      const avg = pts.length ? pts.reduce((s, p) => s + Number(p.candidate_cosine || 0), 0) / pts.length : 0
      const high = pts.filter((p) => Number(p.candidate_cosine || 0) >= 0.6).length
      out[m.run_id] = { avg, high, total: pts.length }
    })
    return out
  }, [evalData.metrics, evalData.points])

  const latestRunIdByMethod = useMemo(() => {
    const seen = {}
    ;[...(evalData.metrics || [])]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .forEach((m) => {
        if (!(m.method in seen)) seen[m.method] = m.run_id
      })
    return seen
  }, [evalData.metrics])

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
    if (loading.convoCv) {
      setError("Please wait for conversational CV generation to finish before exporting.")
      return
    }
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
    setConvoMessages((prev) => [...prev, userLine])
    setConvoInput("")
    setLoading((prev) => ({ ...prev, convoChat: true }))
    try {
      const data = await apiRequest(
        "/cvs/conversation/chat",
        {
          method: "POST",
          body: JSON.stringify({
            message: trimmed,
          }),
        },
        token,
      )
      if (data?.messages?.length) {
        setConvoMessages(data.messages)
      } else {
        setConvoMessages((prev) => [...prev, { role: "assistant", content: data.reply || "" }])
      }
      if (data?.latest_cv_evaluation) {
        setCvEval(data.latest_cv_evaluation)
      }
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
      setMessage("Conversational CV created. You can now export PDF or DOCX.")
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
      <aside className="glass-panel flex max-h-[min(40vh,320px)] shrink-0 flex-col overflow-y-auto rounded-2xl p-4 lg:max-h-none lg:h-full lg:min-h-0 lg:w-[220px]">
        <div className="border-b border-surface-border pb-4 dark:border-surface-dark-border">
          <p className="text-xs uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted">HireBee</p>
          <p className="mt-1 text-lg font-semibold text-ink dark:text-ink-dark">Job Seeker</p>
        </div>
        <nav className="mt-4 grid gap-1">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActivePage(item.key)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition ${activePage === item.key ? "bg-accent text-white" : "text-ink-muted hover:bg-surface-subtle hover:text-ink dark:text-ink-dark-muted dark:hover:bg-surface-dark-subtle dark:hover:text-ink-dark"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-8 border-t border-surface-border pt-3 text-xs text-ink-faint dark:border-surface-dark-border dark:text-ink-dark-faint">
          Theme: {isDark ? "Dark" : "Light"}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          className={`flex min-h-0 flex-1 flex-col gap-4 pr-1 ${activePage === "cv" ? "overflow-hidden" : "overflow-y-auto"}`}
        >
        {message && <p className="shrink-0 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{message}</p>}
        {error && <p className="shrink-0 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

        {activePage === "dashboard" && (
          <section className="grid gap-4 md:grid-cols-4">
            <Metric label="Resume Score" value={`${Math.min(98, Math.max(52, Math.round((resumeInsight?.parsing_confidence || 0.6) * 100)))}%`} />
            <Metric label="Applications" value={apps.length} />
            <Metric label="Interviews" value={apps.filter((a) => a.status === "interview").length} />
            <Metric label="Profile Views" value={145} />
            <article className={`${cardClass} md:col-span-4`}>
              <h3 className="mb-3 font-semibold">Quick Actions</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <button type="button" onClick={() => setActivePage("resume")} className="card-hover rounded-xl border border-surface-border p-4 text-left hover:border-accent dark:border-surface-dark-border"><p className="font-semibold text-ink dark:text-ink-dark">Upload Resume</p><p className="text-xs text-ink-muted dark:text-ink-dark-muted">Get AI-powered analysis</p></button>
                <button type="button" onClick={() => setActivePage("cv")} className="card-hover rounded-xl border border-surface-border p-4 text-left hover:border-accent dark:border-surface-dark-border"><p className="font-semibold text-ink dark:text-ink-dark">Generate CV</p><p className="text-xs text-ink-muted dark:text-ink-dark-muted">Create ATS-friendly CV</p></button>
                <button type="button" onClick={() => setActivePage("jobs")} className="card-hover rounded-xl border border-surface-border p-4 text-left hover:border-accent dark:border-surface-dark-border"><p className="font-semibold text-ink dark:text-ink-dark">Browse Jobs</p><p className="text-xs text-ink-muted dark:text-ink-dark-muted">Find your next role</p></button>
              </div>
            </article>
            <article className={`${cardClass} md:col-span-4`}>
              <h3 className="mb-3 font-semibold">Recommended Jobs</h3>
              <div className="grid gap-3">
                {jobsSortedByMatch.slice(0, 4).map((job) => {
                  const m = matchByJobId.get(job.id)
                  return (
                    <button key={job.id} type="button" onClick={() => { setSelectedJobId(String(job.id)); setApplyForm((p) => ({ ...p, job_id: String(job.id) })); setActivePage("jobs") }} className="card-hover rounded-xl border border-surface-border p-3 text-left text-sm hover:border-accent dark:border-surface-dark-border">
                      <p className="font-semibold text-ink dark:text-ink-dark">{job.title}</p>
                      <p className="text-xs text-ink-muted dark:text-ink-dark-muted">{job.location || "Remote"} | {job.required_skills.join(", ")}</p>
                      <span className="mt-2 inline-flex rounded-full bg-success-bg px-2 py-1 text-xs font-semibold text-success">{formatJobMatchLabel(m)}</span>
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
              <p className="text-sm text-ink-muted dark:text-ink-dark-muted">Upload your resume for AI-powered analysis.</p>
              <form onSubmit={uploadResume} className="mt-4 rounded-xl border border-dashed border-surface-border p-8 text-center dark:border-surface-dark-border">
                <input className="mx-auto block w-full max-w-xs text-sm" type="file" name="resume" accept=".pdf,.docx" />
                <button disabled={loading.upload} className={`${buttonClass} mt-4`} type="submit">{loading.upload ? "Uploading Resume..." : "Upload Resume"}</button>
                <p className="mt-2 text-xs text-ink-muted dark:text-ink-dark-muted">PDF or DOCX (max 10MB recommended)</p>
              </form>
              {loading.upload && (
                <div className="mt-4 rounded-xl border border-accent-muted bg-accent-light p-3">
                  <p className="text-sm font-semibold text-accent-text">Uploading Resume...</p>
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
                    <p className="mb-1 text-xs font-semibold uppercase text-ink-muted dark:text-ink-dark-muted">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {(resumeInsight.extracted_skills || []).map((skill) => (
                        <span key={skill} className="rounded-full bg-accent-light px-2 py-1 text-xs text-accent-text dark:bg-accent/15 dark:text-accent">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-ink-muted dark:text-ink-dark-muted">Summary</p>
                    <p className="rounded-xl border border-surface-border p-3 text-sm dark:border-surface-dark-border">{resumeInsight.parsed_data?.summary || "Summary not detected."}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-muted dark:text-ink-dark-muted">Upload resume to view extraction cards.</p>
              )}
            </article>
          </section>
        )}

        {activePage === "cv" && (
          <section className="flex min-h-0 flex-1 shrink-0 flex-col gap-4 overflow-hidden">
          <article className={`${cardClass} shrink-0`}>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setCvMode("manual")} className={`rounded-xl px-3 py-2 text-sm font-medium transition ${cvMode === "manual" ? "bg-accent text-white" : "border border-surface-border text-ink-muted hover:border-accent hover:text-accent dark:border-surface-dark-border dark:text-ink-dark-muted"}`}>Manual CV Generator</button>
              <button type="button" onClick={() => setCvMode("conversational")} className={`rounded-xl px-3 py-2 text-sm font-medium transition ${cvMode === "conversational" ? "bg-accent text-white" : "border border-surface-border text-ink-muted hover:border-accent hover:text-accent dark:border-surface-dark-border dark:text-ink-dark-muted"}`}>Conversational CV Generator</button>
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-ink-dark-muted">Sections — drag ⋮⋮ to reorder</p>
                  {manualSectionOrder.map((key, idx) => (
                    <div
                      key={key}
                      className="rounded-xl border border-surface-border bg-surface-subtle p-3 dark:border-surface-dark-border dark:bg-surface-dark-subtle"
                      onDragOver={handleDragOverSection}
                      onDrop={(e) => handleDropSection(e, idx)}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          draggable
                          onDragStart={(e) => handleDragStartSection(e, idx)}
                          className="mt-1 cursor-grab select-none rounded border border-surface-border px-1.5 py-1 text-xs text-ink-muted hover:bg-surface-subtle active:cursor-grabbing dark:border-surface-dark-border dark:text-ink-dark-muted dark:hover:bg-surface-dark-subtle"
                          aria-label="Drag to reorder section"
                          title="Drag to reorder"
                        >
                          ⋮⋮
                        </button>
                        <div className="min-w-0 flex-1">
                          <label className="mb-1 block text-xs font-medium text-ink dark:text-ink-dark" htmlFor={`cv-section-${key}`}>
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
                <div className="mt-4 rounded-xl border border-dashed border-surface-border p-3 dark:border-surface-dark-border">
                  <p className="mb-2 text-xs font-semibold text-ink-muted dark:text-ink-dark-muted">Add a section</p>
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
                <div className="mt-4 grid gap-3 border-t border-surface-border pt-4 dark:border-surface-dark-border">
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
                  <button className={buttonClass} type="button" disabled={loading.export || loading.convoCv} onClick={() => exportCv("pdf")}>
                    {loading.export ? "Exporting..." : "Export PDF"}
                  </button>
                  <button className={buttonGhostClass} type="button" disabled={loading.export || loading.convoCv} onClick={() => exportCv("docx")}>
                    {loading.export ? "Exporting..." : "Export DOCX"}
                  </button>
                </div>
                </div>
              </article>
              <article className={`${cardClass} flex min-h-0 flex-col overflow-hidden`}>
                <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink dark:text-ink-dark">Live CV Preview</h3>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {loading.convoCv && (
                      <p className="text-xs text-accent dark:text-accent">Generation in progress — downloads paused…</p>
                    )}
                    <span className="rounded-full bg-success-bg px-2 py-1 text-xs font-semibold text-success">ATS Score: 94%</span>
                    <button
                      type="button"
                      disabled={loading.export || loading.convoCv || !selectedCvId || !selectedCv?.pdf_path}
                      onClick={() => downloadCvOnly("pdf")}
                      className="rounded-lg border border-accent bg-surface-raised px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50 dark:bg-surface-dark-raised"
                    >
                      Download PDF
                    </button>
                    <button
                      type="button"
                      disabled={loading.export || loading.convoCv || !selectedCvId || !selectedCv?.docx_path}
                      onClick={() => downloadCvOnly("docx")}
                      className="rounded-lg border border-accent bg-surface-raised px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50 dark:bg-surface-dark-raised"
                    >
                      Download DOCX
                    </button>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="rounded-xl border border-surface-border p-5 dark:border-surface-dark-border">
                  <h4 className="text-2xl font-semibold text-ink dark:text-ink-dark">{manualCv.full_name || "Your Name"}</h4>
                  <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
                    {[manualCv.email, manualCv.phone, manualCv.location].filter(Boolean).join(" • ") || "email@example.com"}
                  </p>
                  {(manualCv.linkedin?.trim() || manualCv.github?.trim()) && (
                    <p className="mt-2 flex flex-wrap gap-4 text-sm">
                      {manualCv.linkedin?.trim() && (
                        <a href={safeExternalUrl(manualCv.linkedin)} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
                          LinkedIn
                        </a>
                      )}
                      {manualCv.github?.trim() && (
                        <a href={safeExternalUrl(manualCv.github)} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
                          GitHub
                        </a>
                      )}
                    </p>
                  )}
                  <hr className="my-4 border-surface-border dark:border-surface-dark-border" />
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
                                <span key={skill} className="rounded-full bg-accent-light px-2 py-1 text-xs text-accent-text dark:bg-accent/15 dark:text-accent">
                                  {skill}
                                </span>
                              ))}
                            {!String(raw).trim() && <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">{emptyHint}</p>}
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
              {/* Chat header */}
              <div className="flex shrink-0 items-center justify-between border-b border-surface-border pb-4 dark:border-surface-dark-border">
                <div>
                  <h3 className="font-semibold text-ink dark:text-ink-dark">CV Coach</h3>
                  <p className="mt-0.5 text-xs text-ink-muted dark:text-ink-dark-muted">Chat to build your CV, then generate &amp; export</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-xl">🐝</div>
              </div>

              {/* Messages */}
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-4 pr-1">
                {convoMessages.map((msg, idx) => (
                  <div key={`${msg.role}-${idx}`} className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    {msg.role === "assistant" && (
                      <div className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-light text-xs">🐝</div>
                    )}
                    <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-br-sm bg-accent text-white"
                        : "rounded-bl-sm bg-surface-subtle text-ink dark:bg-surface-dark-subtle dark:text-ink-dark"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {loading.convoChat && (
                  <div className="flex items-end gap-2">
                    <div className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-light text-xs">🐝</div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-surface-subtle px-4 py-3 dark:bg-surface-dark-subtle">
                      <span className="h-2 w-2 rounded-full bg-ink-faint animate-bounce [animation-delay:0ms] dark:bg-ink-dark-faint" />
                      <span className="h-2 w-2 rounded-full bg-ink-faint animate-bounce [animation-delay:160ms] dark:bg-ink-dark-faint" />
                      <span className="h-2 w-2 rounded-full bg-ink-faint animate-bounce [animation-delay:320ms] dark:bg-ink-dark-faint" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input + actions */}
              <div className="shrink-0 border-t border-surface-border pt-3 dark:border-surface-dark-border">
                <form onSubmit={handleConvoSend} className="flex gap-2">
                  <input
                    className={inputClass}
                    value={convoInput}
                    onChange={(e) => setConvoInput(e.target.value)}
                    placeholder="Type about your goals, skills, or experience…"
                    disabled={loading.convoChat}
                  />
                  <button className={buttonClass} type="submit" disabled={loading.convoChat || !convoInput.trim()}>
                    Send
                  </button>
                </form>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className={buttonClass} disabled={loading.convoCv} type="button" onClick={generateConversationalCv}>
                    {loading.convoCv ? "Generating CV…" : "Generate Conversational CV"}
                  </button>
                  <button className={buttonClass} type="button" disabled={loading.export || loading.convoCv || !selectedCvId} onClick={() => exportCv("pdf")}>
                    {loading.export ? "Exporting…" : "Export PDF"}
                  </button>
                  <button className={buttonGhostClass} type="button" disabled={loading.export || loading.convoCv || !selectedCvId} onClick={() => exportCv("docx")}>
                    {loading.export ? "Exporting…" : "Export DOCX"}
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
              <p className="mb-3 text-sm text-ink-muted dark:text-ink-dark-muted">AI-powered matches based on your profile.</p>
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
                      className={`rounded-xl border p-4 text-left text-sm transition ${
                        String(job.id) === String(selectedJobId)
                          ? "border-accent bg-accent-light/40 dark:bg-accent/10"
                          : "border-surface-border hover:border-accent hover:bg-surface-subtle dark:border-surface-dark-border dark:hover:bg-surface-dark-subtle"
                      }`}
                    >
                      <p className="text-lg font-semibold text-ink dark:text-ink-dark">{job.title}</p>
                      <p className="text-xs text-ink-muted dark:text-ink-dark-muted">{job.location || "Remote"} • ${job.salary || "N/A"}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="rounded-full bg-success-bg px-2 py-1 text-xs font-semibold text-success">{formatJobMatchLabel(m)}</span>
                        <span className="text-xs text-ink-muted dark:text-ink-dark-muted">Apply now</span>
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
                  <p className="text-sm text-ink-muted dark:text-ink-dark-muted">{selectedJob.location || "Remote"} • {selectedJob.recruiter_email}</p>
                  <h4 className="mt-4 font-semibold">About the role</h4>
                  <p className="mt-1 text-sm whitespace-pre-line">{selectedJob.description}</p>
                  <h4 className="mt-4 font-semibold">Quick Apply</h4>
                  <div className="mt-2 rounded-xl border border-surface-border p-3 text-sm dark:border-surface-dark-border">
                    <p className="text-xs font-semibold uppercase text-ink-muted dark:text-ink-dark-muted">AI-generated cover letter</p>
                    <textarea
                      className={`${inputClass} mt-2 min-h-44`}
                      value={coverLetterDraft}
                      onChange={(e) => setCoverLetterDraft(e.target.value)}
                      placeholder="Generate a cover letter, then edit it before applying."
                    />
                    <p className="mt-2 text-xs text-ink-muted dark:text-ink-dark-muted">
                      {selectedJobLetter ? `Using cover letter #${selectedJobLetter.id}` : "No cover letter linked yet."}
                    </p>
                  </div>
                  <div className="mt-3 rounded-xl border border-surface-border p-3 text-sm dark:border-surface-dark-border">
                    <p className="text-xs font-semibold uppercase text-ink-muted dark:text-ink-dark-muted">Attached CV</p>
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
                    <p className="mt-2 text-xs text-ink-muted dark:text-ink-dark-muted">
                      {applyForm.generated_cv_id
                        ? `Using saved CV: ${cvs.find((cv) => String(cv.id) === String(applyForm.generated_cv_id))?.title || "Selected"}`
                        : resumeId
                          ? `Using uploaded CV/Resume ID: ${resumeId}`
                          : "No CV selected yet"}
                    </p>
                    <label className="mt-3 block text-xs font-semibold uppercase text-ink-muted dark:text-ink-dark-muted">Or upload a new CV (PDF/DOCX)</label>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      className="mt-2 block w-full text-xs"
                      onChange={(e) => uploadCvForQuickApply(e.target.files?.[0])}
                    />
                    {loading.cvUpload && <p className="mt-2 text-xs text-accent">Uploading and attaching new CV...</p>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className={buttonClass} type="button" disabled={loading.coverLetter} onClick={() => generateCoverLetter(selectedJob.id)}>{loading.coverLetter ? "Generating..." : "Generate Cover Letter"}</button>
                    <button className={buttonGhostClass} type="button" disabled={loading.coverLetterSave || !applyForm.cover_letter_id} onClick={saveCoverLetterEdits}>{loading.coverLetterSave ? "Saving..." : "Save Cover Letter"}</button>
                    <button className={buttonClass} type="button" disabled={loading.apply || hasAppliedToSelectedJob} onClick={applyToJob}>{loading.apply ? "Applying..." : hasAppliedToSelectedJob ? "Already Applied" : "Apply Now"}</button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-ink-muted dark:text-ink-dark-muted">Pick a job from the list to view full details and quick apply panel.</p>
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
                  <div key={app.id} className="rounded-xl border border-surface-border p-3 dark:border-surface-dark-border">
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
              <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">Latest runs comparing cosine semantic similarity vs literal skill-overlap similarity.</p>
              {evalData.metrics.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted dark:text-ink-dark-muted">No evaluation runs yet. Click Run Evaluation to generate results.</p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {evalData.metrics.map((m) => {
                    const s = evalSummaryByRun[m.run_id] || { avg: 0, high: 0, total: 0 }
                    return (
                      <div key={m.run_id} className="rounded-xl border border-surface-border p-3 text-sm dark:border-surface-dark-border">
                        <p className="font-semibold text-ink dark:text-ink-dark">{evalMethodLabel(m.method)}</p>
                        <p className="mt-1 text-ink-muted dark:text-ink-dark-muted">
                          Avg similarity {(s.avg * 100).toFixed(1)}% · Jobs &gt;= 60%: {s.high}/{s.total}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </article>
            <article className={cardClass}>
              <h4 className="font-semibold">Run Comparison Graph</h4>
              <div className="mt-3">
                <MiniBarChart
                  items={(evalData.metrics || []).map((m) => ({
                    ...m,
                    method_label: evalMethodLabel(m.method),
                    avg_similarity: (evalSummaryByRun[m.run_id] || { avg: 0 }).avg,
                  }))}
                  valueKey="avg_similarity"
                  labelKey="method_label"
                  max={1}
                />
              </div>
            </article>
            <article className={cardClass}>
              <h4 className="font-semibold">Cosine Similarity Graph (You vs Jobs)</h4>
              <div className="mt-3">
                <ClusterScatter points={evalData.points} method="cosine_similarity" runId={latestRunIdByMethod["cosine_similarity"]} />
              </div>
            </article>
            <article className={cardClass}>
              <h4 className="font-semibold">Skill Overlap Graph (You vs Jobs)</h4>
              <div className="mt-3">
                <ClusterScatter points={evalData.points} method="embedding_distance" runId={latestRunIdByMethod["embedding_distance"]} />
              </div>
            </article>
          </section>
        )}

        {activePage === "profile" && (
          <section className="grid gap-4">
            <article className={cardClass}>
              <h3 className="text-2xl font-semibold">My Profile</h3>
              <p className="text-sm text-ink-muted dark:text-ink-dark-muted">Manage your profile and career details.</p>
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
              <div className="mt-4 rounded-xl border border-surface-border p-4 dark:border-surface-dark-border">
                <p className="text-xs font-semibold uppercase text-ink-muted dark:text-ink-dark-muted">Skill Highlights</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(profileSkills || "").split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
                    <span key={skill} className="rounded-full bg-accent-light px-2 py-1 text-xs text-accent-text dark:bg-accent/15 dark:text-accent">{skill}</span>
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