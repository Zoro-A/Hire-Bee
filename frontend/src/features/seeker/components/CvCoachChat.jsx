import { CvScoreCard } from "@/components/cv/CvScoreCard.jsx"
import { buttonClass, buttonGhostClass, cardClass, inputClass } from "@/styles/uiClasses.js"
import { useSeekerData } from "../SeekerDataContext.jsx"

export function CvCoachChat() {
  const {
    convoMessages,
    convoInput,
    setConvoInput,
    loading,
    chatEndRef,
    handleConvoSend,
    generateConversationalCv,
    exportCv,
    selectedCvId,
    cvEval,
  } = useSeekerData()

  return (
    <article className={`${cardClass} flex min-h-0 flex-1 flex-col overflow-hidden`}>
      {/* Chat header */}
      <div className="flex shrink-0 items-center justify-between border-b border-surface-border pb-4 dark:border-surface-dark-border">
        <div>
          <h3 className="font-semibold text-ink dark:text-ink-dark">CV Coach</h3>
          <p className="mt-0.5 text-xs text-ink-muted dark:text-ink-dark-muted">Chat to build your CV, then generate &amp; export</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-xl">
          <img src="/hirebee-logo.svg" alt="" className="h-5 w-5" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-4 pr-1">
        {convoMessages.map((msg, idx) => (
          <div key={`${msg.role}-${idx}`} className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {msg.role === "assistant" && (
              <div className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs">
                <img src="/hirebee-logo.svg" alt="" className="h-3.5 w-3.5" />
              </div>
            )}
            <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === "user"
                ? "rounded-br-sm bg-brand text-white"
                : "rounded-bl-sm bg-surface-subtle text-ink dark:bg-surface-dark-subtle dark:text-ink-dark"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading.convoChat && (
          <div className="flex items-end gap-2">
            <div className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs">
              <img src="/hirebee-logo.svg" alt="" className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-surface-subtle px-4 py-3 dark:bg-surface-dark-subtle">
              <span className="h-2 w-2 rounded-full bg-ink-faint animate-bounce [animation-delay:0ms] dark:bg-ink-dark-faint" />
              <span className="h-2 w-2 rounded-full bg-ink-faint animate-bounce [animation-delay:160ms] dark:bg-ink-dark-faint" />
              <span className="h-2 w-2 rounded-full bg-ink-faint animate-bounce [animation-delay:320ms] dark:bg-ink-dark-faint" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input + actions */}
      <div className="shrink-0 border-t border-surface-border pt-3 dark:border-surface-dark-border">
        <form onSubmit={handleConvoSend} className="flex gap-2">
          <input
            className={inputClass}
            value={convoInput}
            onChange={(e) => setConvoInput(e.target.value)}
            placeholder="Type about your goals, skills, or experience…"
            disabled={loading.convoChat}
          />
          <button className={buttonClass} type="submit" disabled={loading.convoChat || !convoInput.trim()}>
            Send
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className={buttonClass} disabled={loading.convoCv} type="button" onClick={generateConversationalCv}>
            {loading.convoCv ? "Generating CV…" : "Generate Conversational CV"}
          </button>
          <button className={buttonClass} type="button" disabled={loading.export || loading.convoCv || !selectedCvId} onClick={() => exportCv("pdf")}>
            {loading.export ? "Exporting…" : "Export PDF"}
          </button>
          <button className={buttonGhostClass} type="button" disabled={loading.export || loading.convoCv || !selectedCvId} onClick={() => exportCv("docx")}>
            {loading.export ? "Exporting…" : "Export DOCX"}
          </button>
        </div>
        <CvScoreCard cvEval={cvEval} />
      </div>
    </article>
  )
}
