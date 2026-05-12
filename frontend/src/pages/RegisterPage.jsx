import { GoogleLogin } from "@react-oauth/google"
import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { apiRequest } from "../lib/api.js"
import { inputClass } from "../styles/uiClasses.js"

export function RegisterPage({ setToken, googleClientId }) {
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
