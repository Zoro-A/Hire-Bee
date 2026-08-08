import { GoogleLogin } from "@react-oauth/google"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { PiEnvelopeSimple, PiEye, PiEyeSlash, PiLock } from "react-icons/pi"
import { apiRequest } from "../lib/api.js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBanner } from "@/components/feedback/StatusBanner.jsx"
import { FieldShell } from "../components/auth/FieldShell.jsx"

const fieldInputClass =
  "h-auto flex-1 border-0 bg-transparent p-0 shadow-none text-sm text-ink outline-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-ink-dark"

export function LoginPage({ setToken, googleClientId }) {
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-8 shadow-card dark:border-surface-dark-border dark:bg-surface-dark-raised">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex justify-center">
          <img src="/hirebee-logo.svg" alt="" className="h-12 w-12 rounded-xl ring-2 ring-brand/20" />
        </div>
        <h1 className="text-2xl font-semibold text-ink dark:text-ink-dark">Sign in to your account</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">Welcome back! Please enter your details</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="login-email" className="mb-1 text-ink dark:text-ink-dark">
            Email
          </Label>
          <FieldShell>
            <PiEnvelopeSimple aria-hidden="true" />
            <Input
              id="login-email"
              className={fieldInputClass}
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </FieldShell>
        </div>
        <div>
          <Label htmlFor="login-password" className="mb-1 text-ink dark:text-ink-dark">
            Password
          </Label>
          <FieldShell>
            <PiLock aria-hidden="true" />
            <Input
              id="login-password"
              className={fieldInputClass}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="press shrink-0 text-ink-faint transition hover:text-ink dark:text-ink-dark-faint dark:hover:text-ink-dark"
            >
              {showPassword ? <PiEyeSlash className="size-4" aria-hidden="true" /> : <PiEye className="size-4" aria-hidden="true" />}
            </button>
          </FieldShell>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-ink-muted dark:text-ink-dark-muted">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded" />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-brand hover:underline">
            Forgot password?
          </Link>
        </div>
        <StatusBanner error={error} />
        <Button type="submit" disabled={loading} aria-busy={loading} className="w-full py-3">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
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
      <p className="mt-6 text-center text-sm text-ink-muted dark:text-ink-dark-muted">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-semibold text-brand hover:underline">
          Sign up
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-ink-faint dark:text-ink-dark-faint">
        By signing in, you agree to our <span className="text-brand">Terms</span> and{" "}
        <span className="text-brand">Privacy Policy</span>.
      </p>
    </div>
  )
}
