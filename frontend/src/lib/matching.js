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
      dotClass: "bg-slate-400",
      textClass: "text-slate-700 dark:text-slate-300",
      borderClass: "border-l-4 border-l-slate-300 dark:border-l-slate-600",
      chipClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
      isTop: false,
    }
  }
  if (score >= 80) {
    return {
      label: "Good match",
      dotClass: "bg-emerald-500",
      textClass: "text-emerald-700 dark:text-emerald-300",
      borderClass: "border-l-4 border-l-emerald-500",
      chipClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
      isTop: true,
    }
  }
  if (score >= 70) {
    return {
      label: "Good match",
      dotClass: "bg-emerald-500",
      textClass: "text-emerald-700 dark:text-emerald-300",
      borderClass: "border-l-4 border-l-emerald-400",
      chipClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
      isTop: false,
    }
  }
  if (score >= 40) {
    return {
      label: "Medium match",
      dotClass: "bg-amber-500",
      textClass: "text-amber-700 dark:text-amber-300",
      borderClass: "border-l-4 border-l-amber-400",
      chipClass: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
      isTop: false,
    }
  }
  return {
    label: "Bad match",
    dotClass: "bg-rose-500",
    textClass: "text-rose-700 dark:text-rose-300",
    borderClass: "border-l-4 border-l-rose-400",
    chipClass: "bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
    isTop: false,
  }
}

export function evalMethodLabel(method) {
  if (method === "cosine_similarity") return "Cosine Similarity"
  if (method === "embedding_distance") return "Skill Overlap"
  return method
}
