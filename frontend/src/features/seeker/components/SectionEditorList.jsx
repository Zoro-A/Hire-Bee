import { CORE_CV_SECTION_KEYS, getSectionDisplayLabel } from "@/lib/cv.js"
import { Textarea } from "@/components/ui/textarea.jsx"
import { useSeekerData } from "../SeekerDataContext.jsx"

export function SectionEditorList() {
  const {
    manualCv,
    setManualCv,
    manualSectionOrder,
    sectionExtraLabels,
    removeSectionKey,
    handleDragStartSection,
    handleDragOverSection,
    handleDropSection,
  } = useSeekerData()

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Sections — drag ⋮⋮ to reorder</p>
      {manualSectionOrder.map((key, idx) => (
        <div
          key={key}
          className="rounded-xl border border-surface-border bg-surface-subtle p-3"
          onDragOver={handleDragOverSection}
          onDrop={(e) => handleDropSection(e, idx)}
        >
          <div className="flex items-start gap-2">
            <button
              type="button"
              draggable
              onDragStart={(e) => handleDragStartSection(e, idx)}
              className="press mt-1 cursor-grab select-none rounded border border-surface-border px-1.5 py-1 text-xs text-ink-muted hover:bg-surface-subtle active:cursor-grabbing"
              aria-label="Drag to reorder section"
              title="Drag to reorder"
            >
              ⋮⋮
            </button>
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-xs font-medium text-ink" htmlFor={`cv-section-${key}`}>
                {getSectionDisplayLabel(key, sectionExtraLabels)}
              </label>
              {key === "skills" ? (
                <Textarea
                  id={`cv-section-${key}`}
                  rows={2}
                  value={manualCv[key] ?? ""}
                  onChange={(e) => setManualCv({ ...manualCv, [key]: e.target.value })}
                  onDragOver={handleDragOverSection}
                  onDrop={(e) => handleDropSection(e, idx)}
                  placeholder="Comma-separated skills"
                />
              ) : (
                <Textarea
                  id={`cv-section-${key}`}
                  rows={key === "summary" ? 3 : 4}
                  value={manualCv[key] ?? ""}
                  onChange={(e) => setManualCv({ ...manualCv, [key]: e.target.value })}
                  onDragOver={handleDragOverSection}
                  onDrop={(e) => handleDropSection(e, idx)}
                  placeholder={key === "summary" ? "Professional summary" : `Enter ${getSectionDisplayLabel(key, sectionExtraLabels).toLowerCase()}…`}
                />
              )}
            </div>
            {!CORE_CV_SECTION_KEYS.has(key) && (
              <button
                type="button"
                className="press shrink-0 rounded-lg px-2 py-1 text-xs text-danger hover:bg-danger-bg"
                onClick={() => removeSectionKey(key)}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
