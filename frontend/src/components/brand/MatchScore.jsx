import { HexBadge } from "@/components/brand/HexBadge"
import { getMatchBand } from "@/lib/matching"

/**
 * Hex score badge + band label for a job/candidate match percentage.
 * `band.tone` (band-high|mid|low|none) drives HexBadge's color; until
 * Task 5.1 adds `tone` to getMatchBand, HexBadge's `mid` fallback applies.
 */
export function MatchScore({ value }) {
  const pct = Number.isFinite(Number(value)) ? Math.round(Number(value)) : null
  const band = getMatchBand(value)
  return (
    <div className="inline-flex items-center gap-2">
      <HexBadge tone={band.tone}>{pct !== null ? `${pct}%` : "—"}</HexBadge>
      <span className="text-sm text-ink-muted">{band.label}</span>
    </div>
  )
}
