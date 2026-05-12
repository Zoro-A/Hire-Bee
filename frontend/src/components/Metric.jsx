import { cardClass } from "../styles/uiClasses.js"

export function Metric({ label, value }) {
  return (
    <div className={`${cardClass} p-4`}>
      <p className="text-xs text-[#5f67a4]">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}
