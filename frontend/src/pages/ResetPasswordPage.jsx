import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { apiRequest } from "../lib/api.js"
import { inputClass, buttonClass } from "../styles/uiClasses.js"

export function ResetPasswordPage() {
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
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-8 shadow-card dark:border-surface-dark-border dark:bg-surface-dark-raised">
      <h1 className="text-xl font-semibold text-ink dark:text-ink-dark">Set new password</h1>
      {!token && <p className="mt-2 text-sm text-danger">Missing token. Open the link from your email.</p>}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input className={inputClass} type="password" placeholder="New password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        {err && <p className="text-sm text-danger">{err}</p>}
        {msg && <p className="text-sm text-success">{msg}</p>}
        <button type="submit" disabled={loading || !token} className={`${buttonClass} w-full py-3`}>
          {loading ? "Updating…" : "Update password"}
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
