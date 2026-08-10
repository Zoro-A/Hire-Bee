import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { PiEye, PiEyeSlash, PiLock } from "react-icons/pi"
import { apiRequest } from "../lib/api.js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBanner } from "@/components/feedback/StatusBanner.jsx"
import { FieldShell } from "../components/auth/FieldShell.jsx"

const fieldInputClass =
  "h-auto flex-1 border-0 bg-transparent p-0 shadow-none text-sm text-ink outline-none focus-visible:ring-0 focus-visible:ring-offset-0"

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [msg, setMsg] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-8 shadow-card">
      <h1 className="text-xl font-semibold text-ink">Set new password</h1>
      <StatusBanner error={!token ? "Missing token. Open the link from your email." : ""} />
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="reset-password" className="mb-1 text-ink">
            New password
          </Label>
          <FieldShell>
            <PiLock aria-hidden="true" />
            <Input
              id="reset-password"
              className={fieldInputClass}
              type={showPassword ? "text" : "password"}
              placeholder="New password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
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
        <StatusBanner message={msg} error={err} />
        <Button type="submit" disabled={loading || !token} aria-busy={loading} className="w-full py-3">
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="font-medium text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
