import { test, expect } from "@playwright/test";
import { PLACES } from "../i18n.js";
import AxeBuilder from "@axe-core/playwright";
import { HtmlValidate } from "html-validate";
import { readFile } from "node:fs/promises";
import { LANGUAGES } from "../i18n.js";

/* These tests assert only what a visitor can see, click or hear. There is
 * no module to call: the page is the seam. */

/* Every page the site ships. Ten of them are generated, which is exactly the
 * situation where one branch of a template quietly produces invalid markup
 * that nobody looks at — /ar/ and /ko/ get read as rarely as any file here. */
const PAGES = [
  ...LANGUAGES.map((l) => `${l.path.replace(/^\//, "")}index.html`),
  "404.html",
];

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

    // Counted from i18n.js, not written here. The exits are designed to grow
    // — "日後每架好一個子網域，就多一行" (SPEC.md) — so a literal 2 was a
    // number guaranteed to be wrong on the day the design worked.
    const live = PLACES.filter((p) => p.live);
    await expect(links).toHaveCount(live.length);
    for (const [i, place] of live.entries()) {
      await expect(links.nth(i)).toHaveAttribute("href", place.url);
    }
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

    // A large card with the page's own type on it, not a bare text link.
    await expect(og("image")).toHaveAttribute("content", "https://siao.ai/og.png");
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image"
    );
    const image = await page.request.get("/og.png");
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toContain("image/png");
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
    const icons = await page.locator('link[rel="icon"]').all();
    for (const icon of icons) {
      const href = await icon.getAttribute("href");
      const res = await request.get(href);
      expect(res.status()).toBe(200);
    }
  });

  test("the apple touch icon is served", async ({ request, page }) => {
    await page.goto("/");
    const href = await page
      .locator('link[rel="apple-touch-icon"]')
      .getAttribute("href");
    const res = await request.get(href);
    expect(res.status()).toBe(200);
  });

  for (const file of PAGES) {
    test(`the markup is valid — ${file}`, async () => {
      const html = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
      const report = await new HtmlValidate({
        extends: ["html-validate:recommended"],
      }).validateString(html);
      expect(report.results.flatMap((r) => r.messages)).toEqual([]);
    });
  }
});

test.describe("everyone can read it", () => {
  /* Two of the ten: the Latin page and the right-to-left one. Those are the
   * only two layouts — the other eight differ from the first by two sentences
   * of text, and running axe over all ten would be nine copies of one result
   * for the cost of the tenth. */
  for (const path of ["/", "/ar/"]) {
    test(`no accessibility violations — ${path}`, async ({ page }) => {
      await page.goto(path);
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations).toEqual([]);
    });
  }

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
