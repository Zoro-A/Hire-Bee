import { createContext, useContext, useEffect, useMemo, useState } from "react"

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("hirebee-theme")
    if (saved === "dark") return true
    if (saved === "light") return false
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
    localStorage.setItem("hirebee-theme", isDark ? "dark" : "light")
  }, [isDark])

  const value = useMemo(
    () => ({
      isDark,
      setIsDark,
      toggleTheme: () => setIsDark((d) => !d),
    }),
    [isDark],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
