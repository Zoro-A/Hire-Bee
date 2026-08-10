import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { apiRequest } from "@/lib/api.js"

const RecruiterDataContext = createContext(null)

export function RecruiterDataProvider({ token, user, children }) {
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

  const sortedApps = useMemo(() => {
    return [...(apps || [])].sort((a, b) => {
      const av = Number.isFinite(Number(a.match_percentage)) ? Number(a.match_percentage) : -1
      const bv = Number.isFinite(Number(b.match_percentage)) ? Number(b.match_percentage) : -1
      return bv - av
    })
  }, [apps])

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

  // Plain object, not useMemo: this provider re-renders on every state change
  // anyway (it owns a dozen+ useState calls), so every consumer downstream
  // already re-renders regardless of memoization. Memoizing here would only
  // add a large dependency array that fights react-hooks/exhaustive-deps for
  // zero actual benefit.
  const value = {
    jobs,
    apps,
    interviews,
    logs,
    recruiterMeta,
    myJobs,
    sortedApps,
    message,
    setMessage,
    error,
    setError,
    loading,
    form,
    setForm,
    interviewForm,
    setInterviewForm,
    profile,
    setProfile,
    detailOpen,
    detailId,
    appDetail,
    detailLoading,
    refresh,
    saveProfile,
    postJob,
    updateApplicationStatus,
    scheduleInterview,
    openApplicantDetail,
    closeApplicantDetail,
    interviewAppLabel,
    token,
    user,
  }

  return <RecruiterDataContext.Provider value={value}>{children}</RecruiterDataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- co-located hook, consistent with ThemeContext.jsx
export function useRecruiterData() {
  const ctx = useContext(RecruiterDataContext)
  if (!ctx) throw new Error("useRecruiterData must be used within RecruiterDataProvider")
  return ctx
}
