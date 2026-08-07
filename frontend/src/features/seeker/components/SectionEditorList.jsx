import { CORE_CV_SECTION_KEYS, getSectionDisplayLabel } from "@/lib/cv.js"
import { inputClass } from "@/styles/uiClasses.js"
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
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-ink-dark-muted">Sections — drag ⋮⋮ to reorder</p>
      {manualSectionOrder.map((key, idx) => (
        <div
          key={key}
          className="rounded-xl border border-surface-border bg-surface-subtle p-3 dark:border-surface-dark-border dark:bg-surface-dark-subtle"
          onDragOver={handleDragOverSection}
          onDrop={(e) => handleDropSection(e, idx)}
        >
          <div className="flex items-start gap-2">
            <button
              type="button"
              draggable
              onDragStart={(e) => handleDragStartSection(e, idx)}
              className="mt-1 cursor-grab select-none rounded border border-surface-border px-1.5 py-1 text-xs text-ink-muted hover:bg-surface-subtle active:cursor-grabbing dark:border-surface-dark-border dark:text-ink-dark-muted dark:hover:bg-surface-dark-subtle"
              aria-label="Drag to reorder section"
              title="Drag to reorder"
            >
              ⋮⋮
            </button>
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-xs font-medium text-ink dark:text-ink-dark" htmlFor={`cv-section-${key}`}>
                {getSectionDisplayLabel(key, sectionExtraLabels)}
              </label>
              {key === "skills" ? (
                <textarea
                  id={`cv-section-${key}`}
                  className={inputClass}
                  rows={2}
                  value={manualCv[key] ?? ""}
                  onChange={(e) => setManualCv({ ...manualCv, [key]: e.target.value })}
                  onDragOver={handleDragOverSection}
                  onDrop={(e) => handleDropSection(e, idx)}
                  placeholder="Comma-separated skills"
                />
              ) : (
                <textarea
                  id={`cv-section-${key}`}
                  className={inputClass}
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
                className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
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
