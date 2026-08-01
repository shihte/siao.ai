import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    /* 127.0.0.1, not localhost: on machines that resolve localhost to ::1
     * first, nothing answers — http.server listens on IPv4 only. */
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  expect: {
    /* These two snapshots exist to catch layout and type breaking, not to
     * police antialiasing. A little slack keeps them worth listening to. */
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
