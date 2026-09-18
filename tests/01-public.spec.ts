import { test, expect } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Vorexa/);
});

test("dashboard redirects to login when signed out", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL(/\/login/);
});

test("login rejects bad credentials", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "not-a-real-user@example.com");
  await page.fill("#password", "wrong-password-123");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=/invalid|error/i")).toBeVisible({ timeout: 10000 });
  await expect(page).toHaveURL(/\/login/);
});
