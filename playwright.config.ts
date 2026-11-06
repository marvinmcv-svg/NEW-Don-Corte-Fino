import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end screen tests for the storefront on a desktop browser and two phones.
 *
 *   npm run build && npm run test:e2e
 *
 * Runs against `next start` on port 3100 (reused if already running). Set E2E_BASE_URL to test a
 * deployed site instead, e.g. E2E_BASE_URL=https://example.com npm run test:e2e
 */
const PORT = 3100;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { outputFolder: "e2e/.report", open: "never" }]],
  use: {
    baseURL,
    trace: "off",
    screenshot: "only-on-failure",
    locale: "es-BO",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    // Phones are emulated in Chromium (viewport, touch, DPR, user agent).
    { name: "iphone", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium", browserName: "chromium" } },
    { name: "android", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npx next start -p ${PORT}`, url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
