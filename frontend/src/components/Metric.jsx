import { cardClass } from "../styles/uiClasses.js"

export function Metric({ label, value, icon, iconBg = "bg-accent/15", iconColor = "text-accent", sub }) {
  return (
    <div className={`${cardClass} card-hover flex items-start gap-4`}>
      {icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint">{label}</p>
        <p className="mt-0.5 text-3xl font-bold tracking-tight text-ink dark:text-ink-dark">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-ink-muted dark:text-ink-dark-muted">{sub}</p>}
      </div>
    </div>
  )
}
