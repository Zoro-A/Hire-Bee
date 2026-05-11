export const DEFAULT_CV_SECTION_ORDER = ["summary", "education", "skills", "experience", "projects", "certifications"]
export const CORE_CV_SECTION_KEYS = new Set(DEFAULT_CV_SECTION_ORDER)

export const CORE_SECTION_LABELS = {
  summary: "Professional Summary",
  education: "Education",
  skills: "Skills (comma separated)",
  experience: "Work experience",
  projects: "Projects",
  certifications: "Certifications",
}

export const SECTION_PRESET_OPTIONS = [
  { key: "achievements", label: "Achievements" },
  { key: "extracurricular", label: "Extra Curricular Activities" },
  { key: "awards", label: "Awards" },
  { key: "interests", label: "Interests" },
]

export function getSectionDisplayLabel(key, sectionExtraLabels) {
  if (sectionExtraLabels?.[key]) return sectionExtraLabels[key]
  if (CORE_SECTION_LABELS[key]) return CORE_SECTION_LABELS[key]
  const opt = SECTION_PRESET_OPTIONS.find((o) => o.key === key)
  if (opt) return opt.label
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function slugCustomSectionKey(label) {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 36)
  return `custom_${slug || "section"}`
}

export function safeExternalUrl(raw) {
  const s = String(raw ?? "").trim()
  if (!s) return "#"
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

export function buildManualCvJson(manualCv, manualSectionOrder, sectionExtraLabels, user) {
  const header = {
    name: (manualCv.full_name || user.full_name || "").trim(),
    email: (manualCv.email || user.email || "").trim(),
    phone: (manualCv.phone || "").trim(),
    location: (manualCv.location || "").trim(),
    linkedin: (manualCv.linkedin || "").trim(),
    github: (manualCv.github || "").trim(),
  }
  const section_labels = { ...sectionExtraLabels }
  for (const key of manualSectionOrder) {
    if (!section_labels[key]) {
      const opt = SECTION_PRESET_OPTIONS.find((o) => o.key === key)
      if (opt) section_labels[key] = opt.label
    }
  }
  const sections = {}
  for (const key of manualSectionOrder) {
    const raw = manualCv[key] ?? ""
    if (key === "skills") {
      sections[key] = String(raw)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    } else if (key === "summary") {
      sections[key] = String(raw)
    } else {
      sections[key] = String(raw).trim() ? [{ text: String(raw) }] : []
    }
  }
  return {
    title: manualCv.title || "Untitled CV",
    header,
    section_order: [...manualSectionOrder],
    section_labels,
    sections,
  }
}
