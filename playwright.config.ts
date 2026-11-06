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

const desktop = { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } };
const iphone = { ...devices["iPhone 13"], defaultBrowserType: "chromium" as const, browserName: "chromium" as const };
const android = devices["Pixel 7"];

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
    { name: "desktop", testIgnore: /perf\.spec/, use: { ...desktop } },
    // Phones are emulated in Chromium (viewport, touch, DPR, user agent).
    { name: "iphone", testIgnore: /perf\.spec/, use: { ...iphone } },
    { name: "android", testIgnore: /perf\.spec/, use: { ...android } },
    // Scroll smoothness: chained so only one browser runs at a time.
    { name: "perf-desktop", testMatch: /perf\.spec/, dependencies: ["desktop", "iphone", "android"], use: { ...desktop } },
    { name: "perf-iphone", testMatch: /perf\.spec/, dependencies: ["perf-desktop"], use: { ...iphone } },
    { name: "perf-android", testMatch: /perf\.spec/, dependencies: ["perf-iphone"], use: { ...android } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npx next start -p ${PORT}`, url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
