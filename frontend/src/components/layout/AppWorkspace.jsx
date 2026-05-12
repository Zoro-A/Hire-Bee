import { Link } from "react-router-dom"
import { useTheme } from "../../context/ThemeContext.jsx"
import { RoleRouter } from "../routing/RoleRouter.jsx"

export function AppWorkspace({ user, token, setToken }) {
  const { isDark, toggleTheme } = useTheme()
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f4f6fb] text-[#161a2f] dark:bg-[#0a1022] dark:text-[#e8edff]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#d8dcef] bg-white/90 px-4 py-3 backdrop-blur-sm dark:border-[#1e293b] dark:bg-[#0f172a]/95 sm:px-6">
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
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden px-3 pb-3 pt-2 sm:px-4">
        <RoleRouter user={user} token={token} />
      </div>
    </div>
  )
}
