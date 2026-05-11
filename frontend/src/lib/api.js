/** FastAPI often returns `detail` as a string (HTTPException) or a list of validation objects (422). */
export function formatApiErrorDetail(detail) {
  if (detail == null) return ""
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item
        if (item && typeof item === "object" && "msg" in item) return String(item.msg)
        try {
          return JSON.stringify(item)
        } catch {
          return String(item)
        }
      })
      .join(" ")
  }
  if (typeof detail === "object" && "msg" in detail) return String(detail.msg)
  try {
    return JSON.stringify(detail)
  } catch {
    return String(detail)
  }
}

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1"

export async function apiRequest(path, options = {}, token) {
  const headers = new Headers(options.headers ?? {})
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }
  if (token) headers.set("Authorization", `Bearer ${token}`)
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const data = await response.json()
      const formatted = formatApiErrorDetail(data.detail)
      if (formatted) message = formatted
    } catch {
      // no-op
    }
    throw new Error(message)
  }
  return response.status === 204 ? null : response.json()
}

/** Fetches export binary with Bearer token and triggers the browser download (saves to Downloads). */
export async function downloadCvExport(cvId, format, token) {
  const headers = new Headers()
  if (token) headers.set("Authorization", `Bearer ${token}`)
  const response = await fetch(`${API_BASE}/cvs/${cvId}/download?export_format=${format}`, { headers })
  if (!response.ok) {
    let message = `Download failed (${response.status})`
    try {
      const data = await response.json()
      const formatted = formatApiErrorDetail(data.detail)
      if (formatted) message = formatted
    } catch {
      // no-op
    }
    throw new Error(message)
  }
  const blob = await response.blob()
  const cd = response.headers.get("content-disposition")
  let filename = `cv_${cvId}.${format}`
  const quoted = cd?.match(/filename="([^"]+)"/)
  const plain = cd?.match(/filename=([^;\s]+)/)
  if (quoted?.[1]) filename = quoted[1]
  else if (plain?.[1]) filename = plain[1].replaceAll('"', "")
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Generic binary download with Bearer token (recruiter application attachments, etc.). */
export async function downloadAuthenticatedBlob(path, token, fallbackFilename) {
  const headers = new Headers()
  if (token) headers.set("Authorization", `Bearer ${token}`)
  const response = await fetch(`${API_BASE}${path}`, { headers })
  if (!response.ok) {
    let message = `Download failed (${response.status})`
    try {
      const data = await response.json()
      const formatted = formatApiErrorDetail(data.detail)
      if (formatted) message = formatted
    } catch {
      // no-op
    }
    throw new Error(message)
  }
  const blob = await response.blob()
  const cd = response.headers.get("content-disposition")
  let filename = fallbackFilename
  const quoted = cd?.match(/filename="([^"]+)"/)
  const plain = cd?.match(/filename=([^;\s]+)/)
  if (quoted?.[1]) filename = quoted[1]
  else if (plain?.[1]) filename = plain[1].replaceAll('"', "")
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
