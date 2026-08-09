import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { coveredCodepoints } from "./font-coverage.js";

/* The Chinese page is the same page, not a summary of it: same three acts,
 * same exits, same colophon. Anything true of the English page that isn't
 * true here is a bug rather than a translation choice. */

test("the Chinese page is a whole page, in Chinese", async ({ page }) => {
  await page.goto("/zh/");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hant");
  await expect(page.locator("h1")).toHaveText("Siao");
  await expect(page.locator(".statement")).toHaveText("山頂是謊言。巨石是真的。");
  await expect(page.locator(".exits .eyebrow")).toHaveText("別處");
  await expect(page.locator(".email a")).toHaveAttribute(
    "href",
    "mailto:hello@siao.ai"
  );
});

/* Typing the address without the trailing slash is an ordinary thing people
 * do. Asserted on content rather than on the URL or status: the host answers
 * this with a redirect and the local server answers it directly, and what
 * matters is that both end up showing the Chinese page. */
test("the Chinese page answers without the trailing slash too", async ({
  page,
}) => {
  await page.goto("/zh");
  await expect(page.locator(".statement")).toHaveText("山頂是謊言。巨石是真的。");
});

test("the exits are described in Chinese, from the same data", async ({
  page,
}) => {
  await page.goto("/zh/");
  const links = page.locator(".places li a");
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAttribute("href", "https://git.siao.ai");
  await expect(page.locator(".places .place-desc").nth(0)).toHaveText(
    "自架的 git 伺服器，以及為它寫的前台"
  );
  await expect(page.locator(".places .place-desc").nth(1)).toHaveText(
    "跑在同一台機器上的網頁應用"
  );
});

test("the colophon is here too, in Chinese", async ({ page }) => {
  await page.goto("/zh/");
  const colophon = page.locator(".colophon");
  await expect(colophon.locator(".eyebrow")).toHaveText("版本記");
  await expect(colophon).toContainText("手寫的 HTML");
  await expect(colophon).toContainText("沒有密碼的身分系統");
});

test("the Chinese serif actually loads — no silent fallback", async ({
  page,
}) => {
  await page.goto("/zh/");
  await page.waitForFunction(() => document.fonts.status === "loaded");
  const loaded = await page.evaluate(() =>
    [...document.fonts].some(
      (f) => f.family === "Noto Serif TC" && f.status === "loaded"
    )
  );
  expect(loaded).toBe(true);
});

test("the Chinese page is readable by everyone", async ({ page }) => {
  await page.goto("/zh/");
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

/* The guard.
 *
 * Editing Chinese copy without rebuilding the subset font is a silent
 * failure: the author's machine has system Chinese fonts to fall back on, so
 * the page looks perfect locally while shipping tofu to everyone else. This
 * is the only test in the suite that reads a file rather than the page, and
 * that is exactly why it exists — nothing observable from the page can tell
 * the difference. */
test("every Chinese character on the site is in the shipped font", async ({
  page,
}) => {
  const covered = await coveredCodepoints(
    new URL("../fonts/noto-serif-tc-subset.woff2", import.meta.url)
  );

  const used = new Set();
  for (const path of ["/", "/zh/", "/nonexistent-xyz/"]) {
    await page.goto(path);
    const text = await page.evaluate(() => {
      const parts = [document.body.innerText];
      // The "contact"/"soon"/"聯絡" labels are CSS content, invisible to innerText.
      for (const el of document.querySelectorAll("*")) {
        for (const pseudo of ["::before", "::after"]) {
          const { content } = getComputedStyle(el, pseudo);
          if (content && content !== "none") parts.push(content);
        }
      }
      return parts.join("");
    });
    for (const ch of text) if (ch.codePointAt(0) > 0x7f) used.add(ch);
  }

  const missing = [...used].filter((c) => !covered.has(c.codePointAt(0)));
  expect(
    missing,
    `Not in fonts/noto-serif-tc-subset.woff2 — rerun scripts/subset-font.py: ${missing.join(
      ""
    )}`
  ).toEqual([]);
});
