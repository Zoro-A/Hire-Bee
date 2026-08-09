import { GoogleLogin } from "@react-oauth/google"
import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { PiEnvelopeSimple, PiEye, PiEyeSlash, PiLock, PiUser } from "react-icons/pi"
import { apiRequest } from "../lib/api.js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBanner } from "@/components/feedback/StatusBanner.jsx"
import { FieldShell } from "../components/auth/FieldShell.jsx"

const fieldInputClass =
  "h-auto flex-1 border-0 bg-transparent p-0 shadow-none text-sm text-ink outline-none focus-visible:ring-0 focus-visible:ring-offset-0"

export function RegisterPage({ setToken, googleClientId }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-8 shadow-card">
      <div className="mb-6 text-center">
        <img src="/hirebee-logo.svg" alt="" className="mx-auto mb-3 h-12 w-12 rounded-xl ring-2 ring-brand/20" />
        <h1 className="text-2xl font-semibold text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-ink-muted">Join HireBee in a few steps</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="register-full-name" className="mb-1 text-ink">
            Full name
          </Label>
          <FieldShell>
            <PiUser aria-hidden="true" />
            <Input
              id="register-full-name"
              className={fieldInputClass}
              placeholder="Your full name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </FieldShell>
        </div>
        <div>
          <Label htmlFor="register-role" className="mb-1 text-ink">
            Role
          </Label>
          <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
            <SelectTrigger id="register-role" className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="job_seeker">Job seeker</SelectItem>
              <SelectItem value="recruiter">Recruiter</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="register-email" className="mb-1 text-ink">
            Email
          </Label>
          <FieldShell>
            <PiEnvelopeSimple aria-hidden="true" />
            <Input
              id="register-email"
              className={fieldInputClass}
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </FieldShell>
        </div>
        <div>
          <Label htmlFor="register-password" className="mb-1 text-ink">
            Password
          </Label>
          <FieldShell>
            <PiLock aria-hidden="true" />
            <Input
              id="register-password"
              className={fieldInputClass}
              type={showPassword ? "text" : "password"}
              placeholder="Password (min 8 characters)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="press shrink-0 text-ink-faint transition hover:text-ink"
            >
              {showPassword ? <PiEyeSlash className="size-4" aria-hidden="true" /> : <PiEye className="size-4" aria-hidden="true" />}
            </button>
          </FieldShell>
        </div>
        <StatusBanner error={error} />
        <Button type="submit" disabled={loading} aria-busy={loading} className="w-full py-3">
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>
      {googleClientId && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-raised px-2 text-ink-muted">Or continue with</span>
            </div>
          </div>
          <div className="flex justify-center [&>div]:w-full">
            <GoogleLogin onSuccess={onGoogleSuccess} onError={() => setError("Google sign-in failed")} useOneTap={false} theme="outline" size="large" text="continue_with" shape="rectangular" width="100%" />
          </div>
        </>
      )}
      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
