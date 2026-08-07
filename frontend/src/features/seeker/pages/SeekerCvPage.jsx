import { cardClass } from "@/styles/uiClasses.js"
import { useSeekerData } from "../SeekerDataContext.jsx"
import { ManualCvBuilder } from "../components/ManualCvBuilder.jsx"
import { CvLivePreview } from "../components/CvLivePreview.jsx"
import { CvCoachChat } from "../components/CvCoachChat.jsx"

export function SeekerCvPage() {
  const { cvMode, setCvMode } = useSeekerData()

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <article className={`${cardClass} shrink-0`}>
        <div className="flex flex-wrap gap-2" role="tablist">
          <button
            type="button"
            aria-selected={cvMode === "manual"}
            onClick={() => setCvMode("manual")}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${cvMode === "manual" ? "bg-brand text-white" : "border border-surface-border text-ink-muted hover:border-brand hover:text-brand dark:border-surface-dark-border dark:text-ink-dark-muted"}`}
          >
            Manual CV Generator
          </button>
          <button
            type="button"
            aria-selected={cvMode === "conversational"}
            onClick={() => setCvMode("conversational")}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${cvMode === "conversational" ? "bg-brand text-white" : "border border-surface-border text-ink-muted hover:border-brand hover:text-brand dark:border-surface-dark-border dark:text-ink-dark-muted"}`}
          >
            Conversational CV Generator
          </button>
        </div>
      </article>

      {cvMode === "manual" ? (
        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <ManualCvBuilder />
          <CvLivePreview />
        </div>
      ) : (
        <CvCoachChat />
      )}
    </section>
  )
}
