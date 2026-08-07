import { Link, Outlet } from "react-router-dom"
import { PiMoon, PiSun, PiSignOut } from "react-icons/pi"
import { useTheme } from "@/context/ThemeContext.jsx"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"

export function AppLayout({ user, token, setToken }) {
  const { isDark, toggleTheme } = useTheme()
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-surface text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <header className="flex shrink-0 items-center justify-between border-b border-surface-border bg-card/85 px-4 py-3 backdrop-blur-md sm:px-6">
        <Link to="/" className="press flex items-center gap-2">
          <img src="/hirebee-logo.svg" alt="HireBee home" className="h-9 w-9 rounded-lg" />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">HireBee</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            {isDark ? <PiSun className="size-4" aria-hidden="true" /> : <PiMoon className="size-4" aria-hidden="true" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem("hirebee-persist")
              setToken("")
            }}
          >
            <PiSignOut className="size-4" aria-hidden="true" />
            Logout
          </Button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden px-3 pb-3 pt-2 sm:px-4">
        <Outlet context={{ user, token, setToken }} />
      </div>
      <Toaster />
    </div>
  )
}
