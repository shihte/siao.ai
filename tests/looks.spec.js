import { test, expect } from "@playwright/test";

/* A plain page, nothing moving — one snapshot each of the two sections. */

test("the card", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await expect(page).toHaveScreenshot("card.png");
});

test("the exits", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await page.locator(".exits").scrollIntoViewIfNeeded();
  await expect(page).toHaveScreenshot("exits.png");
});
