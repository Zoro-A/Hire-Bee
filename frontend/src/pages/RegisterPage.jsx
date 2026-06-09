import { GoogleLogin } from "@react-oauth/google"
import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { apiRequest } from "../lib/api.js"
import { inputClass, buttonClass } from "../styles/uiClasses.js"

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
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-8 shadow-card dark:border-surface-dark-border dark:bg-surface-dark-raised">
      <div className="mb-6 text-center">
        <img src="/hirebee-logo.svg" alt="" className="mx-auto mb-3 h-12 w-12 rounded-xl ring-2 ring-accent/20" />
        <h1 className="text-2xl font-semibold text-ink dark:text-ink-dark">Create your account</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">Join HireBee in a few steps</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink dark:text-ink-dark">Full name</label>
          <input className={inputClass} placeholder="Your full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink dark:text-ink-dark">Role</label>
          <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="job_seeker">Job seeker</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink dark:text-ink-dark">Email</label>
          <input className={inputClass} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink dark:text-ink-dark">Password</label>
          <input className={inputClass} type="password" placeholder="Password (min 8 characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={loading} className={`${buttonClass} w-full py-3`}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      {googleClientId && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border dark:border-surface-dark-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-raised px-2 text-ink-muted dark:bg-surface-dark-raised dark:text-ink-dark-muted">Or continue with</span>
            </div>
          </div>
          <div className="flex justify-center [&>div]:w-full">
            <GoogleLogin onSuccess={onGoogleSuccess} onError={() => setError("Google sign-in failed")} useOneTap={false} theme="outline" size="large" text="continue_with" shape="rectangular" width="100%" />
          </div>
        </>
      )}
      <p className="mt-6 text-center text-sm text-ink-muted dark:text-ink-dark-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
