import { test, expect } from "@playwright/test";

test("unauthenticated visitor sees the landing page with exactly one sign-in action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(1);
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("landing page links back to Vorexa and the legal footer", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "vorexa.co.za" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Privacy" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Terms" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Security" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "POPIA/PAIA" })).toBeVisible();
});

test("login page has no public create-account UI", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /create account/i })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: /create account/i })).toHaveCount(0);
});

test("login form rejects an unknown account", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText(/invalid/i)).toBeVisible();
});
