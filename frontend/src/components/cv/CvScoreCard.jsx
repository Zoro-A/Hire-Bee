export function CvScoreCard({ cvEval }) {
  if (!cvEval?.scores) return null
  const s = cvEval.scores
  const metrics = [
    { label: "Faithfulness", value: s.faithfulness },
    { label: "Relevance", value: s.relevance },
    { label: "Professionalism", value: s.professionalism },
    { label: "Completeness", value: s.completeness },
    { label: "Impact", value: s.impact },
  ]
  return (
    <div className="mt-3 rounded-xl border border-brand bg-brand-soft/50 p-4 dark:border-surface-dark-border dark:bg-surface-dark-subtle">
      <p className="text-xs uppercase tracking-wide text-ink-muted dark:text-ink-dark-muted">Gemini CV Evaluation</p>
      <p className="mt-1 text-2xl font-bold tabular text-brand">{Number(s.overall || 0).toFixed(1)} / 100</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm dark:border-surface-dark-border dark:bg-surface-dark-raised">
            <span className="text-ink-muted dark:text-ink-dark-muted">{m.label}:</span>{" "}
            <span className="font-semibold text-ink dark:text-ink-dark">{Number(m.value || 0).toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
