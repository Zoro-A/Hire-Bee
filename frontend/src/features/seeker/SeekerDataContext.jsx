import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiRequest, downloadCvExport } from "@/lib/api.js"
import {
  buildManualCvJson,
  CORE_CV_SECTION_KEYS,
  DEFAULT_CV_SECTION_ORDER,
  slugCustomSectionKey,
} from "@/lib/cv.js"
import { buildEvalSummary, latestRunIdByMethod as computeLatestRunIdByMethod } from "@/lib/evaluation.js"

const SeekerDataContext = createContext(null)

export function SeekerDataProvider({ token, user, children }) {
  const navigate = useNavigate()
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

  const evalSummaryByRun = useMemo(
    () => buildEvalSummary(evalData.metrics, evalData.points),
    [evalData.metrics, evalData.points],
  )

  const latestRunIdByMethod = useMemo(
    () => computeLatestRunIdByMethod(evalData.metrics),
    [evalData.metrics],
  )

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
      navigate("/app/seeker/resume")
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
      navigate("/app/seeker/cv")
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
      navigate("/app/seeker/applications")
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

  // Plain object, not useMemo: this provider re-renders on every state change
  // anyway (it owns ~30 useState calls), so every consumer downstream already
  // re-renders regardless of memoization. Memoizing here would only add a
  // ~50-entry dependency array that fights react-hooks/exhaustive-deps for
  // zero actual benefit.
  const value = {
    // data
    jobs,
    matches,
    apps,
    cvs,
    letters,
    evalData,
    resumeId,
    resumeInsight,
    cvEval,
    // derived
    matchByJobId,
    jobsSortedByMatch,
    filteredJobs,
    evalSummaryByRun,
    latestRunIdByMethod,
    selectedCv,
    selectedJob,
    selectedJobLetter,
    hasAppliedToSelectedJob,
    manualPreviewJson,
    profileSkills,
    // ui state + setters
    message,
    setMessage,
    error,
    setError,
    loading,
    runningEval,
    cvMode,
    setCvMode,
    manualCv,
    setManualCv,
    manualSectionOrder,
    setManualSectionOrder,
    sectionExtraLabels,
    setSectionExtraLabels,
    customSectionLabelInput,
    setCustomSectionLabelInput,
    selectedCvId,
    setSelectedCvId,
    jobQuery,
    setJobQuery,
    selectedJobId,
    setSelectedJobId,
    convoMessages,
    convoInput,
    setConvoInput,
    applyForm,
    setApplyForm,
    coverLetterDraft,
    setCoverLetterDraft,
    chatEndRef,
    user,
    token,
    // actions
    refresh,
    uploadResume,
    createManualCv,
    exportCv,
    downloadCvOnly,
    handleConvoSend,
    generateConversationalCv,
    generateCoverLetter,
    runSeekerEvaluation,
    saveCoverLetterEdits,
    applyToJob,
    uploadCvForQuickApply,
    addPresetSection,
    addCustomSection,
    removeSectionKey,
    handleDragStartSection,
    handleDragOverSection,
    handleDropSection,
  }

  return <SeekerDataContext.Provider value={value}>{children}</SeekerDataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- co-located hook, consistent with ThemeContext.jsx
export function useSeekerData() {
  const ctx = useContext(SeekerDataContext)
  if (!ctx) throw new Error("useSeekerData must be used within SeekerDataProvider")
  return ctx
}
