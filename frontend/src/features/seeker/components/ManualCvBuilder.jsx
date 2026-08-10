import { SECTION_PRESET_OPTIONS } from "@/lib/cv.js"
import { buttonClass, buttonGhostClass, cardClass, inputClass } from "@/styles/uiClasses.js"
import { useSeekerData } from "../SeekerDataContext.jsx"
import { SectionEditorList } from "./SectionEditorList.jsx"

export function ManualCvBuilder() {
  const {
    manualCv,
    setManualCv,
    manualSectionOrder,
    addPresetSection,
    customSectionLabelInput,
    setCustomSectionLabelInput,
    addCustomSection,
    cvs,
    selectedCvId,
    setSelectedCvId,
    loading,
    createManualCv,
    exportCv,
  } = useSeekerData()

  return (
    <article className={`${cardClass} flex min-h-0 flex-col overflow-hidden`}>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
      <h2 className="mb-3 font-semibold">Input Sections</h2>
      <div className="grid gap-3">
        <input className={inputClass} aria-label="CV title" placeholder="CV title" value={manualCv.title} onChange={(e) => setManualCv({ ...manualCv, title: e.target.value })} />
        <input className={inputClass} aria-label="Full name" placeholder="Full name" value={manualCv.full_name} onChange={(e) => setManualCv({ ...manualCv, full_name: e.target.value })} />
        <div className="grid gap-2 md:grid-cols-2">
          <input className={inputClass} aria-label="Email" placeholder="Email" value={manualCv.email} onChange={(e) => setManualCv({ ...manualCv, email: e.target.value })} />
          <input className={inputClass} aria-label="Phone" placeholder="Phone" value={manualCv.phone} onChange={(e) => setManualCv({ ...manualCv, phone: e.target.value })} />
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <input className={inputClass} aria-label="Location" placeholder="Location (optional)" value={manualCv.location} onChange={(e) => setManualCv({ ...manualCv, location: e.target.value })} />
          <input className={inputClass} aria-label="LinkedIn URL" placeholder="LinkedIn URL" value={manualCv.linkedin} onChange={(e) => setManualCv({ ...manualCv, linkedin: e.target.value })} />
          <input className={inputClass} aria-label="GitHub URL" placeholder="GitHub URL" value={manualCv.github} onChange={(e) => setManualCv({ ...manualCv, github: e.target.value })} />
        </div>
      </div>
      <SectionEditorList />
      <div className="mt-4 rounded-xl border border-dashed border-surface-border p-3">
        <p className="mb-2 text-xs font-semibold text-ink-muted">Add a section</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            className={`${inputClass} sm:max-w-xs`}
            aria-label="Add preset section"
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value
              if (v) {
                addPresetSection(v)
                e.target.value = ""
              }
            }}
          >
            <option value="" disabled>
              Choose a preset…
            </option>
            {SECTION_PRESET_OPTIONS.filter((o) => !manualSectionOrder.includes(o.key)).map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            className={`${inputClass} min-w-[8rem] flex-1`}
            aria-label="Custom section title"
            value={customSectionLabelInput}
            onChange={(e) => setCustomSectionLabelInput(e.target.value)}
            placeholder="Custom section title"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addCustomSection()
              }
            }}
          />
          <button type="button" className={buttonClass} onClick={addCustomSection}>
            Add custom
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 border-t border-surface-border pt-4">
        <select className={inputClass} aria-label="Select created CV for export" value={selectedCvId} onChange={(e) => setSelectedCvId(e.target.value)}>
          <option value="">Select created CV for export</option>
          {cvs.map((cv) => (
            <option key={cv.id} value={cv.id}>
              {cv.title} (#{cv.id})
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={buttonClass} type="button" aria-busy={loading.manualCv} disabled={loading.manualCv} onClick={createManualCv}>
          {loading.manualCv ? "Creating..." : "Create / Update CV"}
        </button>
        <button className={buttonClass} type="button" aria-busy={loading.export} disabled={loading.export || loading.convoCv} onClick={() => exportCv("pdf")}>
          {loading.export ? "Exporting..." : "Export PDF"}
        </button>
        <button className={buttonGhostClass} type="button" aria-busy={loading.export} disabled={loading.export || loading.convoCv} onClick={() => exportCv("docx")}>
          {loading.export ? "Exporting..." : "Export DOCX"}
        </button>
      </div>
      </div>
    </article>
  )
}
