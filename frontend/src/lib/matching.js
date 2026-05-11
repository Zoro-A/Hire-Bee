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
      label: "Bad match",
      dotClass: "bg-rose-500",
      textClass: "text-rose-700 dark:text-rose-300",
    }
  }
  if (score >= 70) {
    return {
      label: "Good match",
      dotClass: "bg-emerald-500",
      textClass: "text-emerald-700 dark:text-emerald-300",
    }
  }
  if (score >= 40) {
    return {
      label: "Medium match",
      dotClass: "bg-amber-500",
      textClass: "text-amber-700 dark:text-amber-300",
    }
  }
  return {
    label: "Bad match",
    dotClass: "bg-rose-500",
    textClass: "text-rose-700 dark:text-rose-300",
  }
}

export function evalMethodLabel(method) {
  if (method === "cosine_similarity") return "Cosine Similarity"
  if (method === "embedding_distance") return "Skill Overlap"
  return method
}
