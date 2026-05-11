import { getSectionDisplayLabel } from "../../lib/cv.js"

export function RecruiterStructuredCvPreview({ cvJson }) {
  if (!cvJson || typeof cvJson !== "object") {
    return <p className="text-sm text-[#65709a]">No structured CV attached.</p>
  }
  const header = cvJson.header || cvJson.personal_information || {}
  const name = header.name || header.full_name || "Candidate"
  const line2 = [header.email, header.phone, header.location].filter(Boolean).join(" · ")
  const sections = cvJson.sections || {}
  const order = Array.isArray(cvJson.section_order)
    ? cvJson.section_order
    : ["summary", "education", "skills", "experience", "projects", "certifications"]

  function sectionLabel(key) {
    return getSectionDisplayLabel(key, cvJson.section_labels || {})
  }

  function renderSectionBody(key) {
    const val = sections[key]
    if (key === "skills") {
      const list = Array.isArray(val) ? val : String(val || "").split(",").map((s) => s.trim()).filter(Boolean)
      if (list.length === 0) return <p className="text-sm text-[#65709a]">—</p>
      return (
        <div className="mt-2 flex flex-wrap gap-2">
          {list.map((skill) => (
            <span key={skill} className="rounded bg-[#e8edff] px-2 py-1 text-xs text-[#24408f] dark:bg-[#1e3a5f] dark:text-[#93c5fd]">
              {skill}
            </span>
          ))}
        </div>
      )
    }
    if (key === "summary") {
      return <p className="mt-1 whitespace-pre-line text-sm">{String(val || "").trim() || "—"}</p>
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return <p className="text-sm text-[#65709a]">—</p>
      return (
        <ul className="mt-1 list-disc space-y-2 pl-4 text-sm">
          {val.map((item, i) => (
            <li key={i} className="whitespace-pre-line">
              {typeof item === "string" ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      )
    }
    if (val && typeof val === "object") {
      return (
        <pre className="mt-1 max-h-48 overflow-auto rounded border border-[#e2e6f6] p-2 text-xs dark:border-[#283056]">
          {JSON.stringify(val, null, 2)}
        </pre>
      )
    }
    return <p className="mt-1 whitespace-pre-line text-sm">{String(val ?? "—")}</p>
  }

  return (
    <div className="rounded-xl border border-[#dbe2f7] p-4 dark:border-[#283056]">
      <h4 className="text-xl font-semibold text-[#1a1f3c] dark:text-white">{name}</h4>
      {line2 ? <p className="mt-1 text-sm text-[#5f67a4] dark:text-[#94a3b8]">{line2}</p> : null}
      <hr className="my-3 border-[#dbe2f7] dark:border-[#283056]" />
      {order.map((key) => (
        <div key={key} className="mt-3 border-t border-[#eef2ff] pt-3 first:mt-0 first:border-t-0 first:pt-0 dark:border-[#283056]">
          <h5 className="text-sm font-semibold text-[#1a1f3c] dark:text-white">{sectionLabel(key)}</h5>
          {renderSectionBody(key)}
        </div>
      ))}
    </div>
  )
}
