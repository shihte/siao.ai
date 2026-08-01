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

  test("the subdomains are listed and link out", async ({ page }) => {
    await page.goto("/");
    const links = page.locator(".places li a");
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAttribute("href", "https://git.siao.ai");
    await expect(links.nth(1)).toHaveAttribute("href", "https://apps.siao.ai");
  });

  test("the page is titled and described", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Siao");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Siao — student, self-taught developer, working in Python and AI. The summit is a lie. The boulder is real."
    );
  });
});

test.describe("who this is, to a machine", () => {
  const DESCRIPTION =
    "Siao — student, self-taught developer, working in Python and AI. The summit is a lie. The boulder is real.";

  test("the canonical URL is unambiguous", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://siao.ai/"
    );
  });

  test("a shared link renders a real preview card", async ({ page }) => {
    await page.goto("/");
    const og = (prop) => page.locator(`meta[property="og:${prop}"]`);
    await expect(og("type")).toHaveAttribute("content", "website");
    await expect(og("url")).toHaveAttribute("content", "https://siao.ai/");
    await expect(og("title")).toHaveAttribute("content", "Siao");
    await expect(og("description")).toHaveAttribute("content", DESCRIPTION);

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary"
    );
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      "content",
      "Siao"
    );
  });

  test("the Person claim is real, parseable JSON-LD", async ({ page }) => {
    await page.goto("/");
    const raw = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    const data = JSON.parse(raw); // throws, and fails the test, if it isn't valid JSON

    expect(data["@type"]).toBe("Person");
    expect(data.name).toBe("Siao");
    expect(data.url).toBe("https://siao.ai/");
    expect(data.description.length).toBeGreaterThan(0);
    // No age, no legal name — this is a public, indexed claim, not a bio.
    expect(JSON.stringify(data)).not.toMatch(/\b\d{1,2}\s*(years?|歲)\b/i);
  });

  test("robots.txt explicitly allows everything", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/User-agent:\s*\*/);
    expect(body).toMatch(/Allow:\s*\//);
    expect(body).not.toMatch(/Disallow/i);
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
