import { cn } from "@/lib/utils"

const TONE = {
  high: "bg-brand text-primary-foreground",
  mid: "bg-surface-subtle text-ink-muted",
  low: "bg-danger-bg text-danger",
  none: "bg-surface-subtle text-ink-faint",
}

/** Hexagonal score chip — hex geometry is functional (score container), never decorative. */
export function HexBadge({ children, tone = "mid", className }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 min-w-[3.25rem] items-center justify-center px-2 text-xs font-semibold tabular",
        TONE[tone] ?? TONE.mid,
        className,
      )}
      style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }}
    >
      {children}
    </span>
  )
}
