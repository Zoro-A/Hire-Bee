import path from "node:path"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.js"],
    // e2e/ holds Playwright specs (run via `npm run e2e`); vitest's default
    // include glob otherwise picks up *.spec.js there and fails importing
    // @playwright/test outside a Playwright runner.
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
  },
})
