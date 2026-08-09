import { test, expect } from "@playwright/test";

/* Two pages saying the same thing in two languages look, to a search engine,
 * exactly like one page duplicated — unless they say otherwise. Getting this
 * wrong doesn't break anything a visitor can see; it just quietly splits
 * whatever authority the name "Siao" has between two URLs, which is the
 * opposite of the point. */

const PAGES = [
  { path: "/", lang: "en", canonical: "https://siao.ai/", locale: "en_US" },
  {
    path: "/zh/",
    lang: "zh-Hant",
    canonical: "https://siao.ai/zh/",
    locale: "zh_TW",
  },
];

for (const { path, lang, canonical, locale } of PAGES) {
  test(`${path} names itself and its translation`, async ({ page }) => {
    await page.goto(path);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      canonical
    );

    const alt = (hreflang) =>
      page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`);
    await expect(alt("en")).toHaveAttribute("href", "https://siao.ai/");
    await expect(alt("zh-Hant")).toHaveAttribute("href", "https://siao.ai/zh/");
    await expect(alt("x-default")).toHaveAttribute("href", "https://siao.ai/");

    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      canonical
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      "content",
      locale
    );
  });

  test(`${path} describes itself in its own language`, async ({ page }) => {
    await page.goto(path);
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    const og = await page
      .locator('meta[property="og:description"]')
      .getAttribute("content");

    expect(og).toBe(description);
    // The share preview a person sees is the page's own language, not a default.
    expect(/[一-鿿]/.test(description)).toBe(lang.startsWith("zh"));
  });

  test(`${path} makes a Person claim that names no person`, async ({ page }) => {
    await page.goto(path);
    const data = JSON.parse(
      await page.locator('script[type="application/ld+json"]').textContent()
    );

    expect(data["@type"]).toBe("Person");
    expect(data.name).toBe("Siao");
    expect(data.url).toBe("https://siao.ai/");
    // What this person builds, not adjectives about them — and more than the
    // two words it used to be, now that the page actually says what's here.
    expect(data.knowsAbout.length).toBeGreaterThan(2);
    expect(JSON.stringify(data)).not.toMatch(/\b\d{1,2}\s*(years?|歲)\b/i);
    expect(data.sameAs).toBeUndefined(); // omitted, not emptied
  });
}

test("the sitemap lists both languages and nothing else", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const body = await res.text();

  const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(urls).toEqual(["https://siao.ai/", "https://siao.ai/zh/"]);
  // Each entry declares the other language, same as the pages do.
  expect(body).toContain('hreflang="zh-Hant"');
  expect(body).toContain('hreflang="x-default"');
});

test("robots.txt says where the sitemap is", async ({ request }) => {
  const res = await request.get("/robots.txt");
  const body = await res.text();
  expect(body).toMatch(/Sitemap:\s*https:\/\/siao\.ai\/sitemap\.xml/);
  expect(body).toMatch(/Allow:\s*\//);
  expect(body).not.toMatch(/Disallow/i);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200); // the pointer resolves
});
