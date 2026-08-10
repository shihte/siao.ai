import { test, expect } from "@playwright/test";

/* A plain page, nothing moving.
 *
 * Four shots, not forty. Ten languages produce three layouts: Latin, CJK (its
 * own face and its own leading) and right-to-left. The other seven differ
 * from the first by two sentences of text, which the content tests already
 * assert word for word. Ten near-identical snapshots would go red together on
 * any tracking change, and a suite you update in bulk is one you have stopped
 * reading.
 *
 * The fourth is the menu open — the only piece of this site with a state. */

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

/* The Chinese page renders in a different typeface with different metrics —
 * its own baselines, not a hope that the English ones cover it. */

test("the card, in Chinese", async ({ page }) => {
  await page.goto("/zh-hant/");
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await expect(page).toHaveScreenshot("card-zh.png");
});

test("the exits, in Chinese", async ({ page }) => {
  await page.goto("/zh-hant/");
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await page.locator(".exits").scrollIntoViewIfNeeded();
  await expect(page).toHaveScreenshot("exits-zh.png");
});

/* Right to left is the one language that moves furniture: the switcher swaps
 * corners and the exits align to the other edge. */
test("the exits, right to left", async ({ page }) => {
  await page.goto("/ar/");
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await page.locator(".exits").scrollIntoViewIfNeeded();
  await expect(page).toHaveScreenshot("exits-ar.png");
});

test("the menu, open", async ({ page }) => {
  await page.goto("/");
  await page.locator(".lang-menu summary").click();
  /* The nine other names arrive with their own faces a moment after the click
   * — waiting for fonts before opening would be waiting for the wrong ones. */
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await expect(page).toHaveScreenshot("menu-open.png");
});
