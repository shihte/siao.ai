import { test, expect } from "@playwright/test";
import { readdir } from "node:fs/promises";

import { coveredCodepoints } from "./font-coverage.js";
import { LANGUAGES } from "../i18n.js";

/* The second seam, and the only one that isn't the rendered page.
 *
 * A missing glyph is invisible to every cheaper check: the author's Mac has
 * CJK and Arabic fonts to fall back on, so a subset that lost a character
 * still looks right locally, and document.fonts reports what was declared,
 * not what the file contains. The only honest answer comes from reading the
 * file. That matters more now than it did with one Chinese page: nine of the
 * ten languages are ones the owner cannot proofread, and tofu in the menu
 * would fail the one job the menu has. */

const fontsDir = new URL("../fonts/", import.meta.url);

const everyShippedGlyph = async () => {
  const covered = new Set();
  for (const file of await readdir(fontsDir)) {
    if (!file.endsWith(".woff2")) continue;
    for (const cp of await coveredCodepoints(new URL(file, fontsDir))) covered.add(cp);
  }
  return covered;
};

/* The one character the site draws and does not ship.
 *
 * ↗ is the mark on an outbound link, pure decoration, and it has come from
 * the visitor's own system font since the day it was added — it is in neither
 * the Latin subset nor any of the CJK ones. It stays that way on purpose:
 * every page would have to fetch another file for a single arrow, and U+2197
 * is covered on every OS this site will meet. Named here rather than silently
 * skipped, so that the exception is a decision instead of a gap. */
const DRAWN_BY_THE_SYSTEM = new Set(["↗"]);

/* Checked against every shipped face rather than one of them. The CSS stack
 * falls through by codepoint — © comes from Garamond on the Japanese page,
 * 日本語 comes from the switcher face on the Russian one — so a character is
 * safe if any shipped file has it. */
test("every character the site draws is in a shipped font", async ({ page }) => {
  const covered = await everyShippedGlyph();
  const used = new Map(); // character -> where it was seen

  for (const path of [...LANGUAGES.map((l) => l.path), "/nonexistent-xyz/"]) {
    await page.goto(path);
    /* Open it, so the nine names nobody sees until they click are counted
     * too. The 404 page deliberately has no menu — a dead end doesn't need a
     * ten-language switcher — so this is conditional. */
    await page.evaluate(() => document.querySelector(".lang-menu")?.setAttribute("open", ""));
    const text = await page.evaluate(() => {
      const parts = [document.body.innerText];
      // "contact"/"soon" are CSS content, invisible to innerText.
      for (const el of document.querySelectorAll("*")) {
        for (const pseudo of ["::before", "::after"]) {
          const { content } = getComputedStyle(el, pseudo);
          if (content && content !== "none") parts.push(content);
        }
      }
      return parts.join("");
    });
    for (const ch of text) {
      if (ch.codePointAt(0) > 0x7f && !used.has(ch) && !DRAWN_BY_THE_SYSTEM.has(ch))
        used.set(ch, path);
    }
  }

  const missing = [...used].filter(([ch]) => !covered.has(ch.codePointAt(0)));
  expect(
    missing.map(([ch, where]) => `${ch} (${where})`),
    "Rerun `node scripts/build.js` then scripts/subset-font.py"
  ).toEqual([]);
});

/* Declared is not the same as delivered: a preload pointing at a filename
 * that no longer exists fails silently and the page falls back to whatever
 * the visitor's machine has. */
for (const lang of LANGUAGES) {
  test(`${lang.path} loads the faces it declares`, async ({ page }) => {
    const failed = [];
    page.on("response", (r) => {
      if (r.url().includes("/fonts/") && r.status() >= 400) failed.push(r.url());
    });

    await page.goto(lang.path);
    await page.waitForFunction(() => document.fonts.status === "loaded");

    const loaded = await page.evaluate(() =>
      [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family)
    );
    expect(loaded).toContain("EB Garamond");
    expect(failed).toEqual([]);
  });
}
