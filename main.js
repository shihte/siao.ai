/* Three small behaviours. Everything this file does is an improvement on a
 * page that already works without it: the exits are in the HTML, the language
 * menu is a <details> that opens on its own, and every language is a real
 * link. Turn JavaScript off and you lose an automatic scroll, a remembered
 * preference and two ways of closing a menu — nothing you can't reach.
 *
 * The exits used to be rendered here from an array. They are generated into
 * the HTML now (scripts/build.js), because the site's only outbound links
 * should not depend on a script running.
 */

/* A refresh is a fresh visit, not a return to wherever you'd scrolled to —
 * the browser's own scroll restoration disagrees, so turn it off. Must run
 * before anything else, synchronously, or the restore already happened. */
history.scrollRestoration = "manual";

/* ---- Stay on the card long enough and the page moves on for you ----
 *
 * Any sign of intent from the visitor — scroll, touch, a key — cancels it for
 * good; once you've touched the page yourself, it doesn't try to steer again.
 */

const HOLD_MS = 4000;

const stillness = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!stillness.matches) {
  let timer = setTimeout(() => {
    /* Guarded like the menu below it. This file is only loaded by the ten
     * generated pages, which all have an .exits — but 404.html does not, and
     * the day someone adds the script tag there is not the day they would
     * think of this line. */
    const exits = document.querySelector(".exits");
    if (exits && window.scrollY < 50) {
      exits.scrollIntoView({ behavior: "smooth" });
    }
  }, HOLD_MS);

  const cancel = () => clearTimeout(timer);
  addEventListener("wheel", cancel, { passive: true, once: true });
  addEventListener("touchstart", cancel, { passive: true, once: true });
  addEventListener("keydown", cancel, { once: true });
  addEventListener("pointerdown", cancel, { passive: true, once: true });
}

/* ---- The language menu ---- */

const menu = document.querySelector(".lang-menu");

if (menu) {
  /* Choosing a language is a decision, and decisions get remembered — it
   * outranks the browser's own setting from then on, because a browser
   * language is wrong often enough (anyone reading Chinese on an
   * English-configured machine) that being unable to overrule it would be the
   * real defect. The link works without any of this; a visitor whose storage
   * is unavailable simply gets asked again next time. */
  for (const link of menu.querySelectorAll("a[data-lang]")) {
    link.addEventListener("click", () => {
      try {
        /* data-lang, not hreflang: the redirect on / looks this up in a table
         * keyed by `code`, and hreflang carries `htmlLang`. The two are the
         * same string for all ten languages, so reading the wrong one worked
         * — until the first language whose region needs spelling. */
        localStorage.setItem("lang", link.dataset.lang);
      } catch (e) {}
    });
  }

  /* Two ways out that <details> doesn't give you by itself. */
  addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.open) {
      menu.open = false;
      menu.querySelector("summary").focus();
    }
  });

  addEventListener("pointerdown", (event) => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
}

/* ---- One page view to the family's statistics ----
 *
 * The owner asked for one statistics page across every siao.ai site, with
 * their own visits left out; the receiving end decides who that is
 * (apps-siao-ai lib/woqu/self-traffic.ts). Sends the path and where the
 * visitor came from — no query string, nothing about the visitor. Silent
 * anywhere but siao.ai, so a local serve and the test suite send nothing.
 * Like everything else in this file, the page loses nothing without it. */
try {
  const host = location.hostname;
  if (host === "siao.ai" || host.endsWith(".siao.ai")) {
    // The referrer's origin only — the receiving end needs no more than the host.
    const r = document.referrer ? new URL(document.referrer).origin : "";
    const body = JSON.stringify({
      p: location.pathname,
      r,
      t: document.title,
      s: `${screen.width}x${screen.height}`,
      l: navigator.language,
    });
    navigator.sendBeacon("https://woqu.siao.ai/api/hit", new Blob([body], { type: "text/plain" }));
  }
} catch (e) {}
