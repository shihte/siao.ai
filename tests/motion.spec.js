import { test, expect } from "@playwright/test";

/* Deliberately absent: any assertion about how the fall looks or how long
 * each beat lasts. Nothing automated can judge whether the boulder falls
 * well, and timing assertions on animation would only become noise that
 * gets ignored. That verdict belongs to a human looking at a preview.
 *
 * What is worth holding onto is the behaviour underneath it: the page must
 * hand control back the moment it is asked to, and it must work at all for
 * someone who has turned motion off. */

test.describe("stillness", () => {
  /* emulateMedia rather than `use: { reducedMotion }` — the fixture option
   * silently fails to reach the page in this Playwright version, which made
   * these tests pass against a page that was still animating. */
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("the page never moves on its own", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(7000);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("nothing is lost by turning motion off", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".statement")).toBeVisible();
    await page.locator(".exits").scrollIntoViewIfNeeded();
    await expect(page.locator(".email a")).toBeVisible();
    await expect(page.locator(".email a")).toHaveAttribute(
      "href",
      "mailto:hello@siao.ai"
    );
  });

  test("the boulder does not appear", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".boulder")).toBeHidden();
  });
});

test.describe("who is steering", () => {
  test("the page carries the visitor to the exits by itself", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(7500);
    const [y, viewport] = await page.evaluate(() => [window.scrollY, window.innerHeight]);
    expect(y).toBe(viewport);
  });

  /* The exits are carried into place by the fall rather than laid out where
   * they end up, so anyone who arrives ahead of the fall arrives at nothing.
   * Going looking has to be answered immediately, or the only way to make
   * contact is invisible for several seconds. */
  test("the exits are available at top and Siao is found below", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".email a")).toBeInViewport();
    await expect(page.locator(".email a")).toHaveText("hello@siao.ai");
    await page.evaluate(() => window.scrollTo(0, window.innerHeight));
    await expect(page.locator("h1")).toBeInViewport();
  });

  test("one flick of the wheel and it stops steering", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(800);
    await page.mouse.wheel(0, 1);
    await page.waitForTimeout(7000);
    const y = await page.evaluate(() => window.scrollY);
    expect(y).toBeLessThan(50); // where the visitor left it, not where the page wanted it
  });

  test("a keypress stops it too", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(800);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(7000);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(200);
  });

  test("a second look does not mean a second wait", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(300);
    await page.reload();
    await page.waitForTimeout(3800);
    const [y, viewport] = await page.evaluate(() => [window.scrollY, window.innerHeight]);
    expect(y).toBe(viewport);
  });
});
