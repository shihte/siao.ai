import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { HtmlValidate } from "html-validate";
import { readFile } from "node:fs/promises";

/* These tests assert only what a visitor can see, click or hear. There is
 * no module to call: the page is the seam. */

test.describe("what the visitor gets", () => {
  test("the card says who this is", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveText("Siao");
    await expect(page.locator(".statement")).toHaveText(
      "The summit is a lie. The boulder is real."
    );
  });

  test("the email is reachable", async ({ page }) => {
    await page.goto("/");
    const email = page.locator(".email a");
    await expect(email).toHaveAttribute("href", "mailto:hello@siao.ai");
    await expect(email).toHaveText("hello@siao.ai");
  });

  test("the page is titled and described", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Siao");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "The summit is a lie. The boulder is real."
    );
  });
});

test.describe("assets", () => {
  test("the serif actually loads — no silent fallback", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => document.fonts.status === "loaded");
    const loaded = await page.evaluate(() =>
      [...document.fonts].some(
        (f) => f.family === "EB Garamond" && f.status === "loaded"
      )
    );
    expect(loaded).toBe(true);
  });

  test("every asset the page asks for exists", async ({ page }) => {
    const missing = [];
    page.on("response", (r) => {
      if (r.status() >= 400) missing.push(`${r.status()} ${r.url()}`);
    });
    await page.goto("/", { waitUntil: "networkidle" });
    expect(missing).toEqual([]);
  });

  test("the favicon is served", async ({ request, page }) => {
    await page.goto("/");
    const href = await page.locator('link[rel="icon"]').getAttribute("href");
    const res = await request.get(href);
    expect(res.status()).toBe(200);
  });

  test("the markup is valid", async () => {
    const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
    const report = await new HtmlValidate({
      extends: ["html-validate:recommended"],
    }).validateString(html);
    expect(report.results.flatMap((r) => r.messages)).toEqual([]);
  });
});

test.describe("everyone can read it", () => {
  test("no accessibility violations", async ({ page }) => {
    await page.goto("/");
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });

  test("the name is the page heading", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Siao" })
    ).toBeVisible();
  });

  test("the document declares its language", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
