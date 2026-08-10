import { test, expect } from "@playwright/test";
import { LANGUAGES, SITE } from "../i18n.js";

/* Ten pages saying the same thing in ten languages look, to a search engine,
 * exactly like one page duplicated — unless they say otherwise. Getting this
 * wrong doesn't break anything a visitor can see; it just quietly splits
 * whatever authority the name "Siao" has across ten URLs, which is the
 * opposite of the point.
 *
 * Every language is checked rather than a sample. These assertions are a few
 * milliseconds of reading a <head> each, and the thing most likely to go
 * wrong with a generator is one branch of it — a sample is how you find that
 * out later rather than now. */

const absolute = (path) => SITE.origin + path;

for (const lang of LANGUAGES) {
  test(`${lang.path} names itself and every translation`, async ({ page }) => {
    await page.goto(lang.path);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      absolute(lang.path)
    );

    for (const other of LANGUAGES) {
      await expect(
        page.locator(`link[rel="alternate"][hreflang="${other.htmlLang}"]`)
      ).toHaveAttribute("href", absolute(other.path));
    }
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]')
    ).toHaveAttribute("href", absolute("/"));

    await expect(page.locator("html")).toHaveAttribute("lang", lang.htmlLang);
    await expect(page.locator("html")).toHaveAttribute("dir", lang.dir);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      absolute(lang.path)
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      "content",
      lang.ogLocale
    );
    await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveCount(
      LANGUAGES.length - 1
    );
  });

  test(`${lang.path} describes itself in its own language`, async ({ page }) => {
    await page.goto(lang.path);
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    const og = await page
      .locator('meta[property="og:description"]')
      .getAttribute("content");

    // The share preview a person sees is this page's language, not a default.
    expect(og).toBe(description);
    expect(description).toBe(lang.description);
    // The statement is the one line that stays English everywhere, including
    // here — it is the owner's sentence, not a string to be localised.
    expect(description).toContain(SITE.statement);
  });

  test(`${lang.path} makes a Person claim that names no person`, async ({ page }) => {
    await page.goto(lang.path);
    const data = JSON.parse(
      await page.locator('script[type="application/ld+json"]').textContent()
    );

    expect(data["@type"]).toBe("Person");
    expect(data.name).toBe("Siao");
    expect(data.url).toBe(absolute("/")); // one identity, ten pages
    expect(data.description).toBe(lang.bio);
    expect(data.knowsAbout.length).toBeGreaterThan(2);
    expect(JSON.stringify(data)).not.toMatch(/\b\d{1,2}\s*(years?|歲)\b/i);
    expect(data.sameAs).toBeUndefined(); // omitted, not emptied
  });
}

test("the sitemap is an index spanning the hosts that exist", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const body = await res.text();

  // An index, not a page list: a <sitemapindex> may only contain other
  // sitemaps, which is why the pages moved to their own file.
  expect(body).toContain("<sitemapindex");
  expect(body).not.toContain("<urlset");

  const children = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(children).toEqual([
    "https://siao.ai/sitemap-pages.xml",
    "https://git.siao.ai/sitemap.xml",
  ]);

  // apps.siao.ai has no DNS record. Listing a host that does not resolve
  // is worse than omitting it — it is a crawl error on every fetch.
  expect(children.some((url) => url.includes("apps.siao.ai"))).toBe(false);
});

test("the pages sitemap lists all ten languages and nothing else", async ({
  request,
}) => {
  const res = await request.get("/sitemap-pages.xml");
  expect(res.status()).toBe(200);
  const body = await res.text();

  const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(urls).toEqual(LANGUAGES.map((l) => absolute(l.path)));

  // Each entry declares every language, same as the pages do.
  for (const lang of LANGUAGES) {
    expect(body).toContain(`hreflang="${lang.htmlLang}"`);
  }
  expect(body).toContain('hreflang="x-default"');
});

/* The Chinese page spent the site's first months at /zh/, which is an address
 * that no longer says which Chinese it means. It may be bookmarked or linked
 * from somewhere nobody can edit, so it moves rather than disappears. */
test("the addresses that moved still lead somewhere", async ({ request }) => {
  for (const [from, to] of [
    ["/zh/", "/zh-hant/"],
    ["/en/", "/"],
  ]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(301);
    expect(res.headers()["location"], from).toBe(to);
  }
});

test("robots.txt says where the sitemap is", async ({ request }) => {
  const res = await request.get("/robots.txt");
  const body = await res.text();
  expect(body).toMatch(/Sitemap:\s*https:\/\/siao\.ai\/sitemap\.xml/);
  expect(body).toMatch(/Allow:\s*\//);
  expect(body).not.toMatch(/Disallow/i);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200); // the pointer resolves

  // And so does every sitemap that one names, for this host. The
  // git.siao.ai entry is another origin and another repository's deploy,
  // so it is not this suite's to assert.
  const body2 = await sitemap.text();
  const own = [...body2.matchAll(/<loc>(https:\/\/siao\.ai[^<]*)<\/loc>/g)].map(
    (m) => m[1]
  );
  expect(own.length).toBeGreaterThan(0);
  for (const url of own) {
    const child = await request.get(new URL(url).pathname);
    expect(child.status(), url).toBe(200);
  }
});
