import { Link, Outlet, useLocation } from "react-router-dom"
import { useTheme } from "../../context/ThemeContext.jsx"
import { AUTH_LAYOUT_PATHS } from "../../constants/authLayout.js"
import { buttonClass } from "../../styles/uiClasses.js"

export function MarketingLayout({ user, setToken }) {
  const location = useLocation()
  const authLayout = AUTH_LAYOUT_PATHS.has(location.pathname)
  const { isDark, toggleTheme } = useTheme()
  return (
    <>
      <header
        className={`mx-auto flex w-full items-center justify-between px-6 py-4 ${
          authLayout ? "max-w-lg" : "max-w-7xl"
        }`}
      >
        <Link to="/" className="flex items-center gap-2">
          <img src="/hirebee-logo.svg" alt="" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-bold text-[#1d4ed8] dark:text-[#60a5fa]">HireBee</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb] dark:border-[#334155] dark:bg-[#1e293b] dark:text-[#e2e8f0] dark:hover:bg-[#334155]"
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
              className="rounded-lg border border-[#c9cce5] px-3 py-2 text-sm dark:border-[#303a63]"
            >
              Logout
            </button>
          )}
          {!authLayout && !user && (
            <>
              <Link className="text-sm hover:underline" to="/login">
                Login
              </Link>
              <Link className={buttonClass} to="/register">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>
      <main className={authLayout ? "mx-auto w-full max-w-lg px-6 pb-12" : "mx-auto w-full max-w-7xl px-6 pb-12"}>
        <Outlet />
      </main>
    </>
  )
}
