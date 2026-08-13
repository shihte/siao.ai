import { test, expect } from "@playwright/test";
import { LANGUAGES } from "../i18n.js";

/* Guessing a visitor's language from their browser is only safe if guessing
 * wrong is cheap to undo. These tests are that promise, written down: the
 * guess happens once, a person's own choice outranks it forever after, and
 * the way to make that choice is on screen the moment the page opens — and
 * still works when no script runs at all. */

const english = LANGUAGES[0];

test.describe("the front door guesses once", () => {
  /* A sample, not all ten: the guessing is one loop over one table, so a
   * fourth language exercises nothing the third didn't. What is worth a case
   * each is the shapes that table has to tell apart — two scripts of one
   * language, a plain code, and something absent from it. */
  const ARRIVALS = [
    { locale: "zh-TW", lands: "/zh-hant/" },
    { locale: "zh-CN", lands: "/zh-hans/" },
    { locale: "ja-JP", lands: "/ja/" },
    { locale: "pt-BR", lands: "/" }, // not offered — English, and no guess
  ];

  for (const { locale, lands } of ARRIVALS) {
    test(`${locale} lands on ${lands}`, async ({ browser }) => {
      const context = await browser.newContext({ locale });
      const page = await context.newPage();
      await page.goto("/");
      await expect(page).toHaveURL(new RegExp(`${lands.replace(/\//g, "\\/")}$`));
      await context.close();
    });
  }
});

test.describe("an address you asked for is never second-guessed", () => {
  test.use({ locale: "zh-TW" });

  /* Only / carries the guessing script. A link someone sent you, a bookmark,
   * a typed address: being bounced out of the page you asked for is worse
   * than reading a language you didn't expect. */
  for (const path of ["/ja/", "/ar/", "/de/"]) {
    test(`${path} stays put`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, "\\/")}$`));
    });
  }
});

test.describe("your own choice outranks your browser", () => {
  test.use({ locale: "zh-TW" });

  test("and it survives the next visit", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/zh-hant\/$/); // guessed

    await page.locator(".lang-menu summary").click();
    await page.getByRole("link", { name: "Deutsch" }).click();
    await expect(page).toHaveURL(/\/de\/$/); // corrected by hand

    await page.goto("/");
    await expect(page).toHaveURL(/\/de\/$/); // and it stays corrected
  });

  /* A preference is only worth honouring while it still names a language
   * this site has. A value left over from a path that no longer exists —
   * or from a hand-edited storage entry, or from the day `code` and
   * `htmlLang` stop being the same string — used to be enough to stop the
   * guess without replacing it: the script saw *something* remembered and
   * returned, so the visitor stayed on English with no indication why and
   * nothing to undo. Being unable to read the page is the one case where
   * falling back to the browser's own setting is obviously right. */
  for (const stale of ["zh", "de-DE", "klingon", ""]) {
    test(`a remembered "${stale}" falls back to the browser rather than trapping you`, async ({
      page,
    }) => {
      await page.goto("/");
      await page.evaluate((value) => localStorage.setItem("lang", value), stale);

      await page.goto("/");
      await expect(page).toHaveURL(/\/zh-hant\/$/);
    });
  }

  /* The preference is stored under the same key the redirect looks it up
   * by. These are two different fields on the same row — the link carries
   * `hreflang`, the table is keyed by `code` — and they happen to hold
   * identical strings for all ten languages today. The first language
   * whose region needs spelling (`pt-br` against `pt-BR`) would silently
   * end the arrangement, and nothing would fail except the feature. */
  test("remembers under the key the redirect reads", async ({ page }) => {
    await page.goto("/");
    await page.locator(".lang-menu summary").click();
    await page.getByRole("link", { name: "日本語" }).click();
    await expect(page).toHaveURL(/\/ja\/$/);

    const remembered = await page.evaluate(() => localStorage.getItem("lang"));

    // `code`, because that is what the redirect's lookup table is keyed
    // by. Asserted against i18n.js rather than against anything the page
    // exposes: the site should not have to publish its internals for
    // this to be checkable.
    expect(LANGUAGES.map((l) => l.code)).toContain(remembered);
  });
});

test.describe("the menu", () => {
  test("shows the language you are reading, closed", async ({ page }) => {
    await page.goto("/ja/");
    await expect(page.locator(".lang-menu summary")).toHaveText("日本語");
  });

  test("offers every language, and only as real links", async ({ page }) => {
    await page.goto("/");
    await page.locator(".lang-menu summary").click();

    /* The one you are on is marked and is not a link — clicking your way to
     * where you already are is not an offer worth making. */
    await expect(page.locator(".lang-menu li")).toHaveCount(LANGUAGES.length);
    await expect(page.locator(".lang-menu a")).toHaveCount(LANGUAGES.length - 1);
    await expect(page.locator('.lang-menu [aria-current="page"]')).toHaveText(
      english.endonym
    );

    for (const lang of LANGUAGES.slice(1)) {
      const link = page.getByRole("link", { name: lang.endonym, exact: true });
      await expect(link).toHaveAttribute("href", lang.path);
      await expect(link).toHaveAttribute("hreflang", lang.htmlLang);
      await expect(link).toHaveAttribute("lang", lang.htmlLang);
    }
  });

  test("is there without scrolling, and reached first by a keyboard", async ({
    page,
  }) => {
    await page.goto("/");
    /* The entire reason it sits in the header rather than the footer: someone
     * who cannot read this page must not be asked to read all of it first. */
    await expect(page.locator(".lang-menu summary")).toBeInViewport();

    await page.keyboard.press("Tab");
    await expect(page.locator(".lang-menu summary")).toBeFocused();
  });

  test("closes on Escape and on a click outside", async ({ page }) => {
    const menu = page.locator(".lang-menu");
    await page.goto("/");

    await menu.locator("summary").click();
    await expect(menu).toHaveAttribute("open", "");
    await page.keyboard.press("Escape");
    await expect(menu).not.toHaveAttribute("open", "");

    await menu.locator("summary").click();
    await expect(menu).toHaveAttribute("open", "");
    await page.locator("h1").click();
    await expect(menu).not.toHaveAttribute("open", "");
  });

  test("does not follow you down the page", async ({ page }) => {
    await page.goto("/");
    await page.locator(".exits").scrollIntoViewIfNeeded();
    await expect(page.locator(".lang-menu summary")).not.toBeInViewport();
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false, locale: "zh-TW" });

  /* The promise <details> was chosen for. If this ever fails, the menu has
   * quietly become something only scripted browsers can open, and nine of the
   * ten languages have quietly become unreachable for everyone else. */
  test("the page reads, and every language is still reachable", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/); // no guess is better than a broken guess
    await expect(page.locator("h1")).toHaveText("Siao");
    await expect(page.locator(".places li a")).toHaveCount(2);
    await expect(page.locator(".copyright")).toHaveText("© 2026 Siao");

    await page.locator(".lang-menu summary").click();
    await expect(page.locator(".lang-menu a")).toHaveCount(LANGUAGES.length - 1);

    await page.getByRole("link", { name: "繁體中文" }).click();
    await expect(page).toHaveURL(/\/zh-hant\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hant");
  });
});
