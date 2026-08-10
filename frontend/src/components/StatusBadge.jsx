import {
  PiPaperPlaneTilt,
  PiBookmarkSimple,
  PiCalendarCheck,
  PiCheckCircle,
  PiXCircle,
} from "react-icons/pi"

const STATUS_STYLES = {
  applied:     { className: "bg-info-bg     text-info",          Icon: PiPaperPlaneTilt },
  shortlisted: { className: "bg-brand-soft  text-brand-on-soft",  Icon: PiBookmarkSimple },
  interview:   { className: "bg-warn-bg     text-warn",           Icon: PiCalendarCheck },
  hired:       { className: "bg-success-bg  text-success",        Icon: PiCheckCircle },
  rejected:    { className: "bg-danger-bg   text-danger",         Icon: PiXCircle },
}

export function StatusBadge({ status }) {
  const { className, Icon } = STATUS_STYLES[status] || {
    className: "bg-surface-subtle text-ink-muted",
    Icon: null,
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold capitalize tracking-wide ${className}`}>
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      {status}
    </span>
  )
}
