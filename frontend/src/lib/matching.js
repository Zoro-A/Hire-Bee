export function formatJobMatchLabel(m) {
  if (m != null && typeof m.match_percentage === "number" && Number.isFinite(m.match_percentage)) {
    return `${Math.round(m.match_percentage)}% match`
  }
  return "—"
}

export function getMatchBand(matchPercentage) {
  const score = Number(matchPercentage)
  if (!Number.isFinite(score)) {
    return {
      label: "Unscored",
      tone: "none",
      dotClass: "bg-band-none",
      textClass: "text-ink-muted",
      borderClass: "border-l-4 border-l-band-none",
      chipClass: "bg-surface-subtle text-ink-muted",
      isTop: false,
    }
  }
  if (score >= 80) {
    return {
      label: "Good match",
      tone: "high",
      dotClass: "bg-band-high",
      textClass: "text-brand-on-soft",
      borderClass: "border-l-4 border-l-band-high",
      chipClass: "bg-brand-soft text-brand-on-soft",
      isTop: true,
    }
  }
  if (score >= 70) {
    return {
      label: "Good match",
      tone: "high",
      dotClass: "bg-band-high",
      textClass: "text-brand-on-soft",
      borderClass: "border-l-4 border-l-band-high/60",
      chipClass: "bg-brand-soft text-brand-on-soft",
      isTop: false,
    }
  }
  if (score >= 40) {
    return {
      label: "Medium match",
      tone: "mid",
      dotClass: "bg-band-mid",
      textClass: "text-ink",
      borderClass: "border-l-4 border-l-band-mid",
      chipClass: "bg-surface-subtle text-ink",
      isTop: false,
    }
  }
  return {
    label: "Bad match",
    tone: "low",
    dotClass: "bg-band-low",
    textClass: "text-danger",
    borderClass: "border-l-4 border-l-band-low",
    chipClass: "bg-danger-bg text-danger",
    isTop: false,
  }
}

export function evalMethodLabel(method) {
  if (method === "cosine_similarity") return "Cosine Similarity"
  if (method === "embedding_distance") return "Skill Overlap"
  return method
}
