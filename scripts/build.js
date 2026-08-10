/* Turns i18n.js into the ten pages this site actually serves.
 *
 *     node scripts/build.js          write the pages
 *     node scripts/build.js --check  fail if what's on disk differs
 *
 * Run it after editing i18n.js, and commit what it writes. The output is
 * plain static HTML — Cloudflare Pages serves the repo as-is and never runs
 * this. That is the whole point: the deploy path has no build chain in it, so
 * if this script rots, the live site doesn't. Same arrangement as
 * scripts/subset-font.py, which has been here since the Chinese page shipped.
 *
 * The --check mode is what CI runs. Without it the failure mode is silent and
 * nasty: edit i18n.js, forget to run this, and the site keeps serving the old
 * words while the source of truth says otherwise. Neither the page tests nor
 * the font guard can see that.
 */

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { SITE, PLACES, LANGUAGES, KNOWS_ABOUT, LANGUAGE_GUESSES } from "../i18n.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

/* The self-hosted faces a page's own text can need, beyond the Latin one
 * every page loads. Keyed by the `font` field in i18n.js. */
const FONTS = {
  tc: "/fonts/noto-serif-tc-subset.woff2",
  sc: "/fonts/noto-serif-sc-subset.woff2",
  jp: "/fonts/noto-serif-jp-subset.woff2",
  kr: "/fonts/noto-serif-kr-subset.woff2",
  arabic: "/fonts/noto-naskh-arabic-subset.woff2",
  cyrillic: "/fonts/eb-garamond-cyrillic.woff2",
};

const escape = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const url = (path) => SITE.origin + path;

/* ---- The pieces of a page ---- */

const alternates = () =>
  [
    ...LANGUAGES.map(
      (l) => `<link rel="alternate" hreflang="${l.htmlLang}" href="${url(l.path)}">`
    ),
    `<link rel="alternate" hreflang="x-default" href="${url("/")}">`,
  ].join("\n");

/* Only the front door guesses. An address someone typed, bookmarked or was
 * sent is never second-guessed — being bounced out of the page you asked for
 * is worse than reading the wrong language for one click.
 *
 * Inline and before the stylesheet because it has to decide before the first
 * paint, and replace() rather than assign() so the redirect never becomes a
 * step in the visitor's history that Back has to fight through. */
const guessScript = () => `<script>
(function () {
  var GUESSES = ${JSON.stringify(LANGUAGE_GUESSES)};
  var PATHS = ${JSON.stringify(Object.fromEntries(LANGUAGES.map((l) => [l.code, l.path])))};
  try {
    var chosen = localStorage.getItem("lang");
    if (chosen) {
      if (PATHS[chosen] && PATHS[chosen] !== "/") location.replace(PATHS[chosen]);
      return;
    }
    var wanted = navigator.languages || [navigator.language || ""];
    for (var i = 0; i < wanted.length; i++) {
      var tag = String(wanted[i]).toLowerCase();
      for (var j = 0; j < GUESSES.length; j++) {
        var prefix = GUESSES[j][0];
        if (tag === prefix || tag.indexOf(prefix + "-") === 0) {
          if (PATHS[GUESSES[j][1]] !== "/") location.replace(PATHS[GUESSES[j][1]]);
          return;
        }
      }
    }
  } catch (e) {
    /* Private modes can make localStorage throw on read. A visitor with no
       storage still gets a working English page — never a broken one. */
  }
})();
</script>

`;

/* The way out of the wrong language. First thing in the document, so it is
 * also the first thing a keyboard or a screen reader reaches.
 *
 * <details> rather than a button and a script: it opens with no JavaScript at
 * all, which means all ten languages stay reachable even when nothing runs.
 * It is not a "system menu" — <select> was ruled out, and this renders
 * entirely from our own CSS.
 *
 * Closed, it shows the current language's own name. Whoever needs this can't
 * read the page, so the label has to be recognisable as a language name on
 * sight; "English" and "日本語" are, a translated word for "language" isn't.
 * Every item is a real link, which is where the middle-click, the copyable
 * address and the screen reader's correct pronunciation all come from. */
const menu = (current) => {
  const items = LANGUAGES.map((l) =>
    l.code === current.code
      ? `      <li><span aria-current="page" lang="${l.htmlLang}">${escape(l.endonym)}</span></li>`
      : `      <li><a href="${l.path}" hreflang="${l.htmlLang}" lang="${l.htmlLang}">${escape(
          l.endonym
        )}</a></li>`
  ).join("\n");

  return `<header class="lang-switch">
  <details class="lang-menu">
    <summary lang="${current.htmlLang}">${escape(current.endonym)}</summary>
    <ul>
${items}
    </ul>
  </details>
</header>`;
};

/* Rendered here rather than by main.js, which is where it used to happen. A
 * list of the site's only outbound links should not depend on a script
 * running, and now that a generator exists there is no reason for it to. */
const exits = (lang) =>
  PLACES.map((place) => {
    const desc = lang.places[place.key];
    const info = `<span class="place-info"><span class="place-name">${escape(
      place.name
    )}</span><span class="place-desc">${escape(desc)}</span></span>`;
    return `        <li>${
      place.live ? `<a href="${place.url}">${info}</a>` : info
    }</li>`;
  }).join("\n");

const jsonLd = (lang) =>
  JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: SITE.name,
      url: url("/"),
      description: lang.bio,
      knowsAbout: KNOWS_ABOUT,
    },
    null,
    2
  );

const page = (lang) => `<!DOCTYPE html>
<html lang="${lang.htmlLang}" dir="${lang.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(SITE.name)}</title>

<!-- Generated by scripts/build.js from i18n.js. Do not edit this file. -->

${lang.path === "/" ? guessScript() : ""}<meta name="description" content="${escape(
  lang.description
)}">
<link rel="canonical" href="${url(lang.path)}">

<!-- Every language names every other, and all of them name the English page
     as the default for anyone the browser can't place. Without these, ten
     pages compete as duplicates instead of reading as one page in ten
     languages. -->
${alternates()}

<meta property="og:type" content="website">
<meta property="og:url" content="${url(lang.path)}">
<meta property="og:site_name" content="${escape(SITE.name)}">
<meta property="og:locale" content="${lang.ogLocale}">
${LANGUAGES.filter((l) => l.code !== lang.code)
  .map((l) => `<meta property="og:locale:alternate" content="${l.ogLocale}">`)
  .join("\n")}
<meta property="og:title" content="${escape(SITE.name)}">
<meta property="og:description" content="${escape(lang.description)}">

<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escape(SITE.name)}">
<meta name="twitter:description" content="${escape(lang.description)}">

<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/eb-garamond-latin.woff2" as="font" type="font/woff2" crossorigin>
${
  lang.font
    ? `<link rel="preload" href="${FONTS[lang.font]}" as="font" type="font/woff2" crossorigin>\n`
    : ""
}<!-- The menu's own faces are deliberately not preloaded: closed, <details>
     keeps its contents display:none, so nothing is fetched for the nine
     language names until someone opens it. -->
<link rel="stylesheet" href="/styles.css">

<script type="application/ld+json">
${jsonLd(lang)}
</script>
</head>
<body>

${menu(lang)}

<main>
  <section class="card">
    <h1 class="name">${escape(SITE.name)}</h1>
    <p class="statement">${escape(SITE.statement)}</p>
  </section>

  <section class="exits">
    <div class="exits-content">
      <p class="eyebrow">${escape(SITE.eyebrow)}</p>
      <ul class="places" id="places">
${exits(lang)}
      </ul>
      <!-- Email lives in i18n.js and nowhere else. -->
      <p class="email"><a href="mailto:${SITE.email}">${escape(SITE.email)}</a></p>
      <!-- dir="ltr": English in every language, and its leading © otherwise
           lands on the wrong end of the Arabic page. -->
      <p class="copyright" dir="ltr">${escape(SITE.copyright)}</p>
    </div>
  </section>
</main>

<script src="/main.js"></script>
</body>
</html>
`;

const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by scripts/build.js. Ten addresses, each declaring the other
     nine, so a crawler that has fetched none of them still knows they are one
     page in ten languages. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${LANGUAGES.map(
  (l) => `  <url>
    <loc>${url(l.path)}</loc>
${LANGUAGES.map(
  (a) => `    <xhtml:link rel="alternate" hreflang="${a.htmlLang}" href="${url(a.path)}"/>`
).join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${url("/")}"/>
  </url>`
).join("\n")}
</urlset>
`;

/* /zh/ was the Chinese page for the site's first months and may be bookmarked
 * or linked; it now names a language rather than a script, so it moves. /en/
 * is here because someone will type it. Both are permanent — the addresses
 * are not coming back. */
const redirects = () => `# Generated by scripts/build.js.
/zh/*  /zh-hant/  301
/zh    /zh-hant/  301
/en/*  /          301
/en    /          301
`;

/* ---- Writing, or checking ---- */

const problems = [];

const put = async (relative, contents) => {
  const path = join(ROOT, relative);
  if (CHECK) {
    let current = null;
    try {
      current = await readFile(path, "utf8");
    } catch {}
    if (current !== contents) problems.push(relative);
    return;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents);
};

/* Which characters each subset has to contain.
 *
 * Derived, never hand-kept: a written-down character list is a second copy of
 * the site's own text, and the two drift. scripts/subset-font.py reads this
 * and cuts the files; tests/chinese.spec.js checks the files against what the
 * pages actually render, so the only way to get it wrong is to skip a step,
 * which is what that test is for.
 *
 * A language's own face needs its two descriptions and the name it shows in
 * the closed switcher. The two switcher faces need every other language's
 * name, since those are drawn on all ten pages once the menu is open. */
const nonAscii = (text) => [...new Set([...text])].filter((c) => c.codePointAt(0) > 0x7f);

const characterManifest = () => {
  const perLanguage = {};
  for (const lang of LANGUAGES) {
    if (!lang.font || lang.font === "cyrillic") continue;
    const text = Object.values(lang.places).join("") + lang.endonym;
    perLanguage[lang.font] = nonAscii(text).sort().join("");
  }

  /* Only the two scripts these files exist for. Cyrillic comes from Garamond,
   * Arabic from the face the Arabic page already loads, and the accents in
   * Español and Français are in the Latin subset — none of them belong in a
   * CJK file. */
  const isHangul = (c) => c.codePointAt(0) >= 0xac00 && c.codePointAt(0) <= 0xd7af;
  const isHan = (c) => {
    const cp = c.codePointAt(0);
    return (cp >= 0x3400 && cp <= 0x9fff) || (cp >= 0xf900 && cp <= 0xfaff);
  };
  const switcher = nonAscii(LANGUAGES.map((l) => l.endonym).join("")).filter(
    (c) => isHan(c) || isHangul(c)
  );

  return {
    ...perLanguage,
    "switcher-han": switcher.filter((c) => !isHangul(c)).sort().join(""),
    "switcher-hangul": switcher.filter(isHangul).sort().join(""),
  };
};

for (const lang of LANGUAGES) {
  await put(join(lang.path, "index.html").replace(/^\//, ""), page(lang));
}
await put("sitemap-pages.xml", sitemap());
await put("_redirects", redirects());
await put("fonts/characters.json", JSON.stringify(characterManifest(), null, 2) + "\n");

if (CHECK) {
  if (problems.length) {
    console.error(
      "These files do not match i18n.js — run `node scripts/build.js` and commit the result:\n" +
        problems.map((p) => "  " + p).join("\n")
    );
    process.exit(1);
  }
  console.log("Generated files are up to date.");
} else {
  /* The Chinese page used to live here. Nothing generates it any more. */
  await rm(join(ROOT, "zh"), { recursive: true, force: true });
  console.log(`Wrote ${LANGUAGES.length} pages, sitemap-pages.xml and _redirects.`);
}
