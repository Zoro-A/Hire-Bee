import { test, expect } from "@playwright/test"

const SEEKER = { email: "seed-seeker-01@example.com", password: "SeedDemo123!" }
const RECRUITER = { email: "seed-recruiter-01@example.com", password: "SeedDemo123!" }

// The login form has a hidden checkbox + bullet placeholder for password, so we
// target inputs by type rather than label/placeholder to keep things robust.
async function login(page, { email, password }) {
  await page.goto("/login")
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole("button", { name: /sign in|log in/i }).click()
  await page.waitForURL(/\/app\/(seeker|recruiter|admin)/, { timeout: 15000 })
  // wait for dashboard nav to render (means /auth/me resolved)
  await expect(page.locator("aside")).toBeVisible({ timeout: 15000 })
}

function attachConsoleCollector(page) {
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e)))
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text())
  })
  return errors
}

function filterIgnorableErrors(errors) {
  return errors.filter(
    (e) =>
      !/Failed to load resource|favicon|net::ERR_|404|google|gstatic|GSI_LOGGER/i.test(e),
  )
}

test.describe("smoke", () => {
  test("seeker login lands on dashboard without console errors", async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await login(page, SEEKER)
    await expect(page).toHaveURL(/\/app/)
    // Seeker sidebar marker
    await expect(page.getByText(/Job Seeker/i)).toBeVisible()
    expect(filterIgnorableErrors(errors)).toEqual([])
  })

  test("recruiter login lands on dashboard without console errors", async ({ page }) => {
    const errors = attachConsoleCollector(page)
    await login(page, RECRUITER)
    await expect(page).toHaveURL(/\/app/)
    expect(filterIgnorableErrors(errors)).toEqual([])
  })

  // Issue #73: recruiter applicants list shows visual match prioritization
  test("recruiter applicants page renders match-prioritized cards or empty state", async ({ page }) => {
    await login(page, RECRUITER)
    await page.getByRole("link", { name: /^applicants$/i }).first().click()
    const matchChip = page.getByText(/\d+%\s*match/i).first()
    const noApps = page.getByText(/no applications to your jobs yet/i)
    await expect(matchChip.or(noApps)).toBeVisible({ timeout: 10000 })
  })

  // Issue #70: chat persistence via localStorage. Inject messages, refresh, expect them.
  test("seeker conversational chat persists across refresh (localStorage cache)", async ({ page }) => {
    await login(page, SEEKER)
    // Go to CV section
    await page.getByRole("link", { name: /^generate cv$/i }).first().click()
    // Switch to Conversational mode so the chat transcript renders
    await page.getByRole("button", { name: /conversational cv generator/i }).click()

    // We know from SeekerDataContext.jsx that chatStorageKey is
    // `hirebee:cvChat:${user.id}` where user.id is the numeric id from /auth/me.
    // Fetch /auth/me ourselves using the persisted token rather than parsing JWT.
    const userId = await page.evaluate(async () => {
      const token =
        window.localStorage.getItem("hirebee-token") ||
        window.sessionStorage.getItem("hirebee-token")
      if (!token) return null
      try {
        const apiBase = "http://127.0.0.1:8000/api/v1"
        const res = await fetch(`${apiBase}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return null
        const me = await res.json()
        return me.id
      } catch {
        return null
      }
    })
    if (userId == null) test.skip(true, "could not resolve user id from token")

    const key = `hirebee:cvChat:${userId}`
    const fake = [
      { role: "user", content: "PERSIST_MARKER_X" },
      { role: "assistant", content: "PERSIST_REPLY_Y" },
    ]
    await page.evaluate(
      ([k, v]) => window.localStorage.setItem(k, JSON.stringify(v)),
      [key, fake],
    )
    await page.reload()
    // After reload, app must rehydrate session, navigate to CV → conversational
    await expect(page.locator("aside")).toBeVisible({ timeout: 15000 })
    await page.getByRole("link", { name: /^generate cv$/i }).first().click()
    await page.getByRole("button", { name: /conversational cv generator/i }).click()

    // Chat is rehydrated from localStorage in the initial state of convoMessages.
    // The /cvs/conversation/history call may overwrite it, but only if the server
    // returns more messages than what we cached. Our cached 2 vs server default 0
    // means our cached survives. Assert marker present.
    await expect(page.getByText("PERSIST_MARKER_X")).toBeVisible({ timeout: 10000 })
  })

  // Issue #72: while convoCv loading is true, Download buttons should be disabled.
  // We just verify the surrounding UI exposes the buttons + Live CV Preview header.
  test("seeker CV preview area exposes download buttons + no spurious generation banner", async ({ page }) => {
    await login(page, SEEKER)
    await page.getByRole("link", { name: /^generate cv$/i }).first().click()
    // Manual mode is default → Live CV Preview header should render
    await expect(page.getByRole("heading", { name: /live cv preview/i })).toBeVisible({
      timeout: 10000,
    })
    // Both Download buttons present (they will be disabled until a CV is created)
    await expect(page.getByRole("button", { name: /^download pdf$/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /^download docx$/i })).toBeVisible()
    // The "Generation in progress" banner should NOT be visible when convoCv=false
    await expect(page.getByText(/generation in progress/i)).toHaveCount(0)
  })

  // Issues #71 + #74: navigate to evaluation page. Either evaluation cards render
  // or the "No evaluation runs yet" empty state shows.
  test("seeker evaluation page renders summary cards or empty state", async ({ page }) => {
    await login(page, SEEKER)
    await page.getByRole("link", { name: /^evaluation$/i }).first().click()
    const hdr = page.getByRole("heading", { name: /recommendation evaluation/i })
    const empty = page.getByText(/no evaluation runs yet/i)
    await expect(hdr).toBeVisible({ timeout: 10000 })
    // Either there's at least one method card or the empty-state copy is visible.
    await expect(empty.or(page.getByText(/avg similarity/i).first())).toBeVisible({
      timeout: 10000,
    })
  })

  // Deep-linking + reload persistence — the point of the nested-route refactor.
  test("seeker section is deep-linkable and survives a reload", async ({ page }) => {
    await login(page, SEEKER)
    await page.goto("/app/seeker/evaluation")
    await expect(page.getByRole("heading", { name: /recommendation evaluation/i })).toBeVisible({ timeout: 15000 })
    await page.reload()
    await expect(page).toHaveURL(/\/app\/seeker\/evaluation/)
    await expect(page.getByRole("heading", { name: /recommendation evaluation/i })).toBeVisible({ timeout: 15000 })
  })

  test("browser back returns to the previous seeker section", async ({ page }) => {
    await login(page, SEEKER)
    await page.getByRole("link", { name: /^jobs$/i }).first().click()
    await expect(page).toHaveURL(/\/app\/seeker\/jobs/)
    await page.getByRole("link", { name: /^applications$/i }).first().click()
    await expect(page).toHaveURL(/\/app\/seeker\/applications/)
    await page.goBack()
    await expect(page).toHaveURL(/\/app\/seeker\/jobs/)
  })

  test("a seeker cannot reach the recruiter workspace", async ({ page }) => {
    await login(page, SEEKER)
    await page.goto("/app/recruiter/applicants")
    await expect(page).toHaveURL(/\/app\/seeker/)
  })
})
