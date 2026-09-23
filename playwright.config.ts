import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: "html",
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    launchOptions: process.env.PW_LOCAL_CHROME_PATH
      ? { executablePath: process.env.PW_LOCAL_CHROME_PATH }
      : undefined,
  },
});
