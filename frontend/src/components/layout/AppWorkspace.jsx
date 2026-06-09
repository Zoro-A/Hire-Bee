import { Link } from "react-router-dom"
import { useTheme } from "../../context/ThemeContext.jsx"
import { RoleRouter } from "../routing/RoleRouter.jsx"
import { buttonGhostClass } from "../../styles/uiClasses.js"

export function AppWorkspace({ user, token, setToken }) {
  const { isDark, toggleTheme } = useTheme()
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-surface text-ink dark:bg-surface-dark dark:text-ink-dark">
      <header className="flex shrink-0 items-center justify-between border-b border-surface-border bg-surface-raised/85 px-4 py-3 backdrop-blur-md dark:border-surface-dark-border dark:bg-surface-dark/80 sm:px-6">
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
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden px-3 pb-3 pt-2 sm:px-4">
        <RoleRouter user={user} token={token} />
      </div>
    </div>
  )
}
