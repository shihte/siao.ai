import { test, expect } from "@playwright/test";

/* Two snapshots, both of states that hold still.
 *
 * Snapshotting a frame mid-fall would fail on a few milliseconds of drift,
 * and a suite that cries wolf is worse than no suite. Motion is switched
 * off here so both states are stable by construction. */

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

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
