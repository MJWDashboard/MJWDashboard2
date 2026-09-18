import { test, expect } from "@playwright/test";
import { login, expectNoAppError } from "./helpers";

const EMAIL = process.env.CI_TEST_MEMBER_EMAIL!;
const PASSWORD = process.env.CI_TEST_MEMBER_PASSWORD!;

test.beforeEach(async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "CI_TEST_MEMBER_EMAIL / CI_TEST_MEMBER_PASSWORD not set");
  await login(page, EMAIL, PASSWORD);
});

test("team member sidebar hides admin-only tabs", async ({ page }) => {
  const nav = await page.locator("nav").innerText();
  expect(nav).not.toContain("Team & Access");
  expect(nav).not.toContain("Audit Log");
  expect(nav).toContain("Support Tickets");
});

test("team member only sees their assigned building", async ({ page }) => {
  await page.goto("/dashboard/buildings");
  const rows = page.locator("table tbody tr");
  await expect(rows).toHaveCount(1, { timeout: 10000 });
  await expect(page.locator("body")).toContainText("CI Smoke Test Building");
  await expectNoAppError(page);
});

test("team member sees the task assigned by the portfolio manager", async ({ page }) => {
  await page.goto("/dashboard/messages");
  await expect(page.locator("body")).toContainText("[CI Smoke] task assignment check", { timeout: 10000 });
});
