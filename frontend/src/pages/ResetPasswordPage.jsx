import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { apiRequest } from "../lib/api.js"
import { inputClass } from "../styles/uiClasses.js"

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
