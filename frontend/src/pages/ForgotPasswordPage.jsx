import { useState } from "react"
import { Link } from "react-router-dom"
import { apiRequest } from "../lib/api.js"
import { inputClass, buttonClass } from "../styles/uiClasses.js"

export function ForgotPasswordPage() {
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
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-8 shadow-card dark:border-surface-dark-border dark:bg-surface-dark-raised">
      <h1 className="text-xl font-semibold text-ink dark:text-ink-dark">Forgot password</h1>
      <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">Enter your email and we&apos;ll send reset instructions if an account exists.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input className={inputClass} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {err && <p className="text-sm text-danger">{err}</p>}
        {msg && <p className="text-sm text-success">{msg}</p>}
        <button type="submit" disabled={loading} className={`${buttonClass} w-full py-3`}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="font-medium text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
