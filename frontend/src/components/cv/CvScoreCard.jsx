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
    <div className="mt-3 rounded-xl border border-[#d8dcef] bg-[#f8faff] p-4 dark:border-[#2d355c] dark:bg-[#101933]">
      <p className="text-xs uppercase tracking-wide text-[#65709a]">Gemini CV Evaluation</p>
      <p className="mt-1 text-2xl font-semibold text-[#1a1f3c] dark:text-white">{Number(s.overall || 0).toFixed(1)} / 100</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-[#d6dcf0] px-3 py-2 text-sm dark:border-[#2d355c]">
            <span className="text-[#65709a]">{m.label}:</span> <span className="font-medium">{Number(m.value || 0).toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
