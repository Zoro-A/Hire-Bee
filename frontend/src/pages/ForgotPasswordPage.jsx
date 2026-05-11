import { useState } from "react"
import { Link } from "react-router-dom"
import { apiRequest } from "../lib/api.js"
import { inputClass } from "../styles/uiClasses.js"

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
