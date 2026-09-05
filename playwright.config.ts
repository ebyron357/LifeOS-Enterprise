import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright verification for LifeOS operational surfaces.
 * Runs against a local `next start` production build.
 * Named viewports: desktop 1440, laptop 1024, mobile 390.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/e2e-results.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop-1440",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "chromium-laptop-1024",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 } },
    },
    {
      name: "chromium-mobile-390",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "webkit-desktop",
      testMatch: /conversation\.spec\.ts/,
      use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "webkit-mobile",
      testMatch: /conversation\.spec\.ts/,
      use: { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: "npm run build && npm run start -- -p 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
