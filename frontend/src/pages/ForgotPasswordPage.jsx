import { useState } from "react"
import { Link } from "react-router-dom"
import { PiEnvelopeSimple } from "react-icons/pi"
import { apiRequest } from "../lib/api.js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBanner } from "@/components/feedback/StatusBanner.jsx"
import { FieldShell } from "../components/auth/FieldShell.jsx"

const fieldInputClass =
  "h-auto flex-1 border-0 bg-transparent p-0 shadow-none text-sm text-ink outline-none focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-ink-dark"

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
        <div>
          <Label htmlFor="forgot-password-email" className="mb-1 text-ink dark:text-ink-dark">
            Email
          </Label>
          <FieldShell>
            <PiEnvelopeSimple aria-hidden="true" />
            <Input
              id="forgot-password-email"
              className={fieldInputClass}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FieldShell>
        </div>
        <StatusBanner message={msg} error={err} />
        <Button type="submit" disabled={loading} aria-busy={loading} className="w-full py-3">
          {loading ? "Sending…" : "Send reset link"}
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
