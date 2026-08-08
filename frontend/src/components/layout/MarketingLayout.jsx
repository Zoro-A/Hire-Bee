import { Link, Outlet, useLocation } from "react-router-dom"
import { PiMoon, PiSun } from "react-icons/pi"
import { useTheme } from "../../context/ThemeContext.jsx"
import { AUTH_LAYOUT_PATHS } from "../../constants/authLayout.js"
import { Button } from "@/components/ui/button"

export function MarketingLayout({ user, setToken }) {
  const location = useLocation()
  const authLayout = AUTH_LAYOUT_PATHS.has(location.pathname)
  const { isDark, toggleTheme } = useTheme()
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <header role="banner" className="sticky top-0 z-40 border-b border-surface-border bg-surface-raised/80 backdrop-blur-md">
        <div className={`mx-auto flex w-full items-center justify-between px-6 py-4 ${authLayout ? "max-w-lg" : "max-w-7xl"}`}>
          <Link to="/" className="flex items-center gap-2">
            <img src="/hirebee-logo.svg" alt="" className="h-9 w-9 rounded-lg" />
            <span className="font-display text-lg font-semibold tracking-tight text-ink">HireBee</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <PiSun className="size-4" aria-hidden="true" /> : <PiMoon className="size-4" aria-hidden="true" />}
            </Button>
            {!authLayout && user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("hirebee-persist")
                  setToken("")
                }}
              >
                Logout
              </Button>
            )}
            {!authLayout && !user && (
              <>
                <Link
                  className="text-sm font-medium text-ink-muted transition hover:text-brand"
                  to="/login"
                >
                  Login
                </Link>
                <Button asChild>
                  <Link to="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main
        id="main"
        className={
          authLayout
            ? "mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-lg items-center justify-center px-6 py-12"
            : "mx-auto w-full max-w-7xl px-6 pb-12 pt-8"
        }
      >
        {authLayout ? (
          <div className="relative w-full">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--brand-soft)_0%,transparent_62%)]"
            />
            <Outlet />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </>
  )
}
