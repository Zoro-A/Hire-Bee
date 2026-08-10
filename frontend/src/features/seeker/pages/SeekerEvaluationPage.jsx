import { evalMethodLabel } from "@/lib/matching.js"
import { MiniBarChart } from "@/components/charts/MiniBarChart.jsx"
import { ClusterScatter } from "@/components/charts/ClusterScatter.jsx"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { cardClass, buttonClass } from "@/styles/uiClasses.js"
import { useSeekerData } from "../SeekerDataContext.jsx"

export function SeekerEvaluationPage() {
  const { evalData, evalSummaryByRun, latestRunIdByMethod, runningEval, runSeekerEvaluation } = useSeekerData()

  return (
    <section className="min-h-0 flex-1 overflow-y-auto pr-1">
      <PageHeader title="Evaluation" description="Recommendation quality across matching methods." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <article className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl font-semibold">Recommendation Evaluation</h2>
            <button className={buttonClass} type="button" onClick={runSeekerEvaluation} aria-busy={runningEval} disabled={runningEval}>
              {runningEval ? "Running..." : "Run Evaluation"}
            </button>
          </div>
          <p className="mt-1 text-sm text-ink-muted">Latest runs comparing cosine semantic similarity vs literal skill-overlap similarity.</p>
          {evalData.metrics.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No evaluation runs yet. Click Run Evaluation to generate results.</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {evalData.metrics.map((m) => {
                const s = evalSummaryByRun[m.run_id] || { avg: 0, high: 0, total: 0 }
                return (
                  <div key={m.run_id} className="rounded-xl border border-surface-border p-3 text-sm">
                    <p className="font-semibold text-ink">{evalMethodLabel(m.method)}</p>
                    <p className="mt-1 text-ink-muted">
                      Avg similarity {(s.avg * 100).toFixed(1)}% · Jobs &gt;= 60%: {s.high}/{s.total}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </article>
        <article className={cardClass}>
          <h2 className="font-semibold">Run Comparison Graph</h2>
          <div className="mt-3">
            <MiniBarChart
              items={(evalData.metrics || []).map((m) => ({
                ...m,
                method_label: evalMethodLabel(m.method),
                avg_similarity: (evalSummaryByRun[m.run_id] || { avg: 0 }).avg,
              }))}
              valueKey="avg_similarity"
              labelKey="method_label"
              max={1}
            />
          </div>
        </article>
        <article className={cardClass}>
          <h2 className="font-semibold">Cosine Similarity Graph (You vs Jobs)</h2>
          <div className="mt-3">
            <ClusterScatter points={evalData.points} method="cosine_similarity" runId={latestRunIdByMethod["cosine_similarity"]} />
          </div>
        </article>
        <article className={cardClass}>
          <h2 className="font-semibold">Skill Overlap Graph (You vs Jobs)</h2>
          <div className="mt-3">
            <ClusterScatter points={evalData.points} method="embedding_distance" runId={latestRunIdByMethod["embedding_distance"]} />
          </div>
        </article>
      </div>
    </section>
  )
}
