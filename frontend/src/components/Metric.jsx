import { cardClass } from "../styles/uiClasses.js"

export function Metric({ label, value }) {
  return (
    <div className={`${cardClass} card-hover`}>
      <p className="text-xs font-medium uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-ink dark:text-ink-dark">{value}</p>
    </div>
  )
}
