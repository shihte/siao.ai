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

test("the colophon", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await page.locator(".colophon").scrollIntoViewIfNeeded();
  await expect(page).toHaveScreenshot("colophon.png");
});

/* The Chinese page renders in a different typeface with different metrics —
 * its own baselines, not a hope that the English ones cover it. */

test("the card, in Chinese", async ({ page }) => {
  await page.goto("/zh/");
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await expect(page).toHaveScreenshot("card-zh.png");
});

test("the exits and colophon, in Chinese", async ({ page }) => {
  await page.goto("/zh/");
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await page.locator(".colophon").scrollIntoViewIfNeeded();
  await expect(page).toHaveScreenshot("colophon-zh.png");
});
