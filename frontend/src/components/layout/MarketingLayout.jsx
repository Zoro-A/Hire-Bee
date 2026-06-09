import { Link, Outlet, useLocation } from "react-router-dom"
import { useTheme } from "../../context/ThemeContext.jsx"
import { AUTH_LAYOUT_PATHS } from "../../constants/authLayout.js"
import { buttonClass, buttonGhostClass } from "../../styles/uiClasses.js"

export function MarketingLayout({ user, setToken }) {
  const location = useLocation()
  const authLayout = AUTH_LAYOUT_PATHS.has(location.pathname)
  const { isDark, toggleTheme } = useTheme()
  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b border-surface-border bg-surface-raised/80 backdrop-blur-md dark:border-surface-dark-border dark:bg-surface-dark/80 ${
          authLayout ? "" : ""
        }`}
      >
        <div className={`mx-auto flex w-full items-center justify-between px-6 py-4 ${authLayout ? "max-w-lg" : "max-w-7xl"}`}>
          <Link to="/" className="flex items-center gap-2">
            <img src="/hirebee-logo.svg" alt="" className="h-9 w-9 rounded-lg" />
            <span className="text-lg font-bold text-gradient">HireBee</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={buttonGhostClass}
              aria-label="Toggle theme"
            >
              {isDark ? "Light mode" : "Dark mode"}
            </button>
            {!authLayout && user && (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("hirebee-persist")
                  setToken("")
                }}
                className={buttonGhostClass}
              >
                Logout
              </button>
            )}
            {!authLayout && !user && (
              <>
                <Link
                  className="text-sm font-medium text-ink-muted transition hover:text-accent dark:text-ink-dark-muted dark:hover:text-accent"
                  to="/login"
                >
                  Login
                </Link>
                <Link className={buttonClass} to="/register">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main
        className={
          authLayout
            ? "mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-lg items-center justify-center px-6 py-12"
            : "mx-auto w-full max-w-7xl px-6 pb-12 pt-8"
        }
      >
        {authLayout ? (
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--color-accent-light)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgb(124_58_237/0.07)_0%,transparent_60%)]" />
            <Outlet />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </>
  )
}
