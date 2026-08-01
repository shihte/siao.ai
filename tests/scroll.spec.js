import { test, expect } from "@playwright/test";

/* Stay on the card long enough and the page moves on for you. No timing
 * assertions on how the scroll itself looks — only on the three externally
 * observable rules: it happens if you wait, it doesn't if you touch
 * anything first, and it never happens at all with motion turned off. */

test("left alone, the page scrolls to the exits on its own", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator(".email a")).toBeInViewport({ timeout: 6000 });
});

test("touching the page first cancels it for good", async ({ page }) => {
  await page.goto("/");
  await page.mouse.wheel(0, 1); // the visitor takes the wheel
  await page.waitForTimeout(4500);
  // where the wheel nudge itself left it, not where the page wanted to take it
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(50);
});

test("reduced motion never scrolls on its own", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForTimeout(4500);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
