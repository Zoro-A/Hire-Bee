import { GoogleLogin } from "@react-oauth/google"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { apiRequest } from "../lib/api.js"
import { inputClass } from "../styles/uiClasses.js"
import { FieldShell } from "../components/auth/FieldShell.jsx"

export function LoginPage({ setToken, googleClientId }) {
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
          <FieldShell>
            <span className="text-[#9ca3af]" aria-hidden>✉</span>
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none dark:text-white"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </FieldShell>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#374151] dark:text-[#d1d5db]">Password</label>
          <FieldShell>
            <span className="text-[#9ca3af]" aria-hidden>🔒</span>
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none dark:text-white"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </FieldShell>
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
