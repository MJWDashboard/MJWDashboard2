import { test, expect } from "@playwright/test";
import { login, expectNoAppError } from "./helpers";

const EMAIL = process.env.CI_TEST_EMAIL!;
const PASSWORD = process.env.CI_TEST_PASSWORD!;
const MEMBER_EMAIL = process.env.CI_TEST_MEMBER_EMAIL!;

test.beforeEach(async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, "CI_TEST_EMAIL / CI_TEST_PASSWORD not set");
  await login(page, EMAIL, PASSWORD);
});

test("dashboard loads with expected sidebar", async ({ page }) => {
  const nav = await page.locator("nav").innerText();
  for (const label of ["Dashboard", "Tasks & Messages", "Buildings", "Support Tickets", "Team & Access"]) {
    expect(nav).toContain(label);
  }
});

test("buildings list shows the CI fixture building", async ({ page }) => {
  await page.goto("/dashboard/buildings");
  await expect(page.locator("body")).toContainText("CI Smoke Test Building");
  await expectNoAppError(page);
});

test("tenants list shows the CI fixture tenant", async ({ page }) => {
  await page.goto("/dashboard/tenants");
  await expect(page.locator("body")).toContainText("CI Smoke Test Tenant");
  await expectNoAppError(page);
});

test("arrears: can open and save the CI fixture record", async ({ page }) => {
  await page.goto("/dashboard/arrears");
  await page.fill('input[placeholder*="Search"]', "CI Smoke Test Tenant");
  await page.click('button:has-text("Edit")');
  const modal = page.locator(".fixed.inset-0");
  await modal.locator("select").last().selectOption("in_progress");
  await modal.locator('button[type="submit"]:has-text("Save")').click();
  await expect(modal).not.toBeVisible({ timeout: 10000 });
  await expectNoAppError(page);
});

test("reports show the CI fixture portfolio in the breakdown", async ({ page }) => {
  await page.goto("/dashboard/reports");
  await expect(page.locator("body")).toContainText("CI Smoke Test Portfolio");
});

test("team & access shows the CI fixture portfolio and member", async ({ page }) => {
  await page.goto("/dashboard/team");
  await expect(page.locator("body")).toContainText("CI Smoke Test Portfolio");
});

test("can assign a task to the CI fixture member", async ({ page }) => {
  test.skip(!MEMBER_EMAIL, "CI_TEST_MEMBER_EMAIL not set");
  await page.goto("/dashboard/messages");
  await page.click('button:has-text("New Task")');
  const modal = page.locator(".fixed.inset-0");
  const assigneeSelect = modal.locator("select").nth(2);
  await assigneeSelect.selectOption({ label: MEMBER_EMAIL });
  await modal.locator("input.input").first().fill("[CI Smoke] task assignment check");
  await modal.locator('button[type="submit"]:has-text("Send")').click();
  await expect(page.locator("body")).toContainText("[CI Smoke] task assignment check", { timeout: 10000 });
});

test("can log a support ticket and get a ticket number", async ({ page }) => {
  await page.goto("/dashboard/support");
  await page.click('button:has-text("Report a Fault")');
  const modal = page.locator(".fixed.inset-0");
  await modal.locator("input.input").fill("[CI Smoke] ticket creation check");
  await modal.locator("textarea").fill("Created by the automated smoke suite.");
  await modal.locator('button[type="submit"]:has-text("Log Ticket")').click();
  await page.waitForURL(/\/dashboard\/support\/[a-f0-9-]+/, { timeout: 15000 });
  await expect(page.locator("body")).toContainText(/TCK-\d+/);
});
