import { cardClass } from "@/styles/uiClasses.js"
import { PageHeader } from "@/components/feedback/PageHeader.jsx"
import { useSeekerData } from "../SeekerDataContext.jsx"
import { ManualCvBuilder } from "../components/ManualCvBuilder.jsx"
import { CvLivePreview } from "../components/CvLivePreview.jsx"
import { CvCoachChat } from "../components/CvCoachChat.jsx"

export function SeekerCvPage() {
  const { cvMode, setCvMode } = useSeekerData()

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <PageHeader title="Generate CV" description="Build an ATS-ready CV manually or through a chat coach." />
      <article className={`${cardClass} shrink-0`}>
        <div className="flex flex-wrap gap-2" role="group" aria-label="CV generator mode">
          <button
            type="button"
            aria-pressed={cvMode === "manual"}
            onClick={() => setCvMode("manual")}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${cvMode === "manual" ? "bg-brand text-primary-foreground" : "border border-surface-border text-ink-muted hover:border-brand hover:text-brand"}`}
          >
            Manual CV Generator
          </button>
          <button
            type="button"
            aria-pressed={cvMode === "conversational"}
            onClick={() => setCvMode("conversational")}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${cvMode === "conversational" ? "bg-brand text-primary-foreground" : "border border-surface-border text-ink-muted hover:border-brand hover:text-brand"}`}
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
