import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/* The live site used to answer every unknown path with 200 and the English
 * homepage — an SPA fallback nobody asked for. That is a soft 404: crawlers
 * index infinitely many URLs that don't exist, and, worse for us, it means a
 * missing file can never be told apart from a present one. Every assertion
 * about /zh/ below depends on this being fixed first. */

test("an address that doesn't exist says so", async ({ request }) => {
  const res = await request.get("/nonexistent-xyz/");
  expect(res.status()).toBe(404);
});

test("the not-found page is part of the same site, and lets you leave", async ({
  page,
}) => {
  await page.goto("/nonexistent-xyz/");
  await expect(page.getByRole("link", { name: /siao/i })).toHaveAttribute(
    "href",
    "/"
  );
});

test("the homepage is not what you get for a wrong address", async ({ page }) => {
  await page.goto("/nonexistent-xyz/");
  await expect(page.locator("h1")).not.toHaveText("Siao");
});

test("a wrong address is still readable by everyone", async ({ page }) => {
  await page.goto("/nonexistent-xyz/");
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test("a wrong address asks not to be indexed", async ({ page }) => {
  await page.goto("/nonexistent-xyz/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex"
  );
});
