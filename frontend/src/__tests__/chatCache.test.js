import { describe, it, expect, beforeEach, vi } from "vitest"

// Vitest 4 + jsdom uses a file-backed localStorage that does not expose .clear().
// Stub window.localStorage with a plain in-memory Map implementation so tests
// are fully isolated without relying on the environment's storage backend.
function makeLocalStorageMock() {
  const store = new Map()
  return {
    get length() { return store.size },
    key(i) { return [...store.keys()][i] ?? null },
    getItem(k) { return store.has(k) ? store.get(k) : null },
    setItem(k, v) { store.set(k, String(v)) },
    removeItem(k) { store.delete(k) },
    clear() { store.clear() },
  }
}

const STORAGE_PREFIX = "hirebee:cvChat:"

function cacheKey(userId) {
  return userId ? `${STORAGE_PREFIX}${userId}` : null
}

function loadCached(userId, fallback) {
  const key = cacheKey(userId)
  if (!key) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  return fallback
}

function clearAllChatCaches() {
  const toRemove = []
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const k = window.localStorage.key(i)
    if (k && k.startsWith(STORAGE_PREFIX)) toRemove.push(k)
  }
  toRemove.forEach((k) => window.localStorage.removeItem(k))
}

describe("chat cache (issue #70)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", makeLocalStorageMock())
  })

  it("returns fallback when no cache for user", () => {
    const fallback = [{ role: "assistant", content: "hi" }]
    expect(loadCached(1, fallback)).toEqual(fallback)
  })

  it("restores cached messages when present", () => {
    const msgs = [{ role: "user", content: "hello" }, { role: "assistant", content: "world" }]
    window.localStorage.setItem(cacheKey(42), JSON.stringify(msgs))
    expect(loadCached(42, [])).toEqual(msgs)
  })

  it("ignores corrupt JSON gracefully", () => {
    window.localStorage.setItem(cacheKey(42), "{not json")
    const fallback = [{ role: "assistant", content: "fallback" }]
    expect(loadCached(42, fallback)).toEqual(fallback)
  })

  it("ignores empty arrays in cache", () => {
    window.localStorage.setItem(cacheKey(42), "[]")
    const fallback = [{ role: "assistant", content: "fallback" }]
    expect(loadCached(42, fallback)).toEqual(fallback)
  })

  it("isolates caches per user id", () => {
    window.localStorage.setItem(cacheKey(1), JSON.stringify([{ role: "user", content: "alice" }]))
    window.localStorage.setItem(cacheKey(2), JSON.stringify([{ role: "user", content: "bob" }]))
    expect(loadCached(1, [])[0].content).toBe("alice")
    expect(loadCached(2, [])[0].content).toBe("bob")
  })

  it("clearAllChatCaches removes only chat keys, not other localStorage keys", () => {
    window.localStorage.setItem(cacheKey(1), JSON.stringify([{ role: "user", content: "x" }]))
    window.localStorage.setItem("token", "abc")
    window.localStorage.setItem("theme", "dark")
    clearAllChatCaches()
    expect(window.localStorage.getItem(cacheKey(1))).toBe(null)
    expect(window.localStorage.getItem("token")).toBe("abc")
    expect(window.localStorage.getItem("theme")).toBe("dark")
  })
})
