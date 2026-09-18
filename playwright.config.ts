import { defineConfig, devices } from "@playwright/test";

// An unset SMOKE_BASE_URL secret still comes through CI as an empty string
// rather than undefined, and `??` doesn't catch that - every CI run was
// silently getting baseURL: "" and failing every test with "Cannot navigate
// to invalid URL" before a single real check ran. `||` catches both cases.
const BASE_URL = process.env.SMOKE_BASE_URL || "https://mjw-dashboard2.vercel.app";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ignoreHTTPSErrors: !!process.env.SANDBOX_LOCAL_RUN,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: process.env.SANDBOX_LOCAL_RUN
          ? { args: ["--ignore-certificate-errors"] }
          : {},
      },
    },
  ],
});
