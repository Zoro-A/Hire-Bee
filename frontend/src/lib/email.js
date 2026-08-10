/**
 * Shared status -> Badge variant mapping for email logs (admin overview,
 * admin email log table, recruiter email log table). Previously three
 * near-identical copies had already drifted apart (only the recruiter
 * version handled "queued"); "sent" also mapped to the brand-colored
 * `default` variant instead of `success`, contradicting the semantic
 * palette everywhere else a lifecycle reaches a good outcome.
 */
export function emailStatusBadgeVariant(status) {
  const s = (status || "").toLowerCase()
  if (s.startsWith("sent")) return "success"
  if (s.startsWith("failed")) return "destructive"
  if (s.startsWith("queued")) return "warn"
  return "secondary"
}
