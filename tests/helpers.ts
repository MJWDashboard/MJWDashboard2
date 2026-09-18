import { Page, expect } from "@playwright/test";

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
}

export async function expectNoAppError(page: Page) {
  const text = await page.locator("body").innerText();
  expect(text).not.toContain("Application error");
  expect(text).not.toContain("Something went wrong");
}
