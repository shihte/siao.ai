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

/* siao.ai landing attribution — the copy every non-Next family site pastes into its beacon.
 *
 * Kept in step with apps-siao-ai/lib/woqu/attribution.ts by
 * lib/woqu/attribution-snippet.test.ts, which runs this file and compares.
 * Call once per page load, on the first page view:
 *
 *   const landing = siaoLanding();          // { a, ft } — spread into the beacon body
 *   body = { p, r, t, s, l, ...landing };
 *
 * It reads ?s= ?f= ?utm_source/medium/campaign, keeps the first visit's source
 * in localStorage "siao.firstTouch" for 30 days, and takes those parameters
 * out of the address bar. Never throws. */
function siaoLanding() {
  var CODE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;
  var CHANNELS = ["sheet", "copy", "story"];
  var DAY30 = 30 * 24 * 60 * 60 * 1000;
  var NAMES = ["instagram","threads","facebook","line","x","dcard","discord","youtube","tiktok","ptt","reddit","google","bing","yahoo","duckduckgo","chatgpt","perplexity","claude","gemini","share","direct","internal","other"];
  var UTM = { ig:"instagram", insta:"instagram", instagram:"instagram", threads:"threads", fb:"facebook", facebook:"facebook", line:"line", x:"x", twitter:"x", dcard:"dcard", discord:"discord", yt:"youtube", youtube:"youtube", tiktok:"tiktok", ptt:"ptt", reddit:"reddit", google:"google" };
  var HOSTS = [
    [/(^|\.)instagram\.com$/, "instagram"], [/(^|\.)threads\.(net|com)$/, "threads"],
    [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "facebook"], [/(^|\.)line\.me$/, "line"],
    [/^(t\.co|x\.com|twitter\.com|mobile\.twitter\.com)$/, "x"], [/(^|\.)dcard\.tw$/, "dcard"],
    [/(^|\.)(discord\.com|discordapp\.com|discord\.gg)$/, "discord"], [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
    [/(^|\.)tiktok\.com$/, "tiktok"], [/(^|\.)(ptt\.cc)$/, "ptt"], [/(^|\.)reddit\.com$/, "reddit"],
    [/(^|\.)gemini\.google\.com$/, "gemini"], [/(^|\.)google\.[a-z.]+$/, "google"], [/(^|\.)bing\.com$/, "bing"],
    [/(^|\.)yahoo\.(com|co\.jp)$|(^|\.)search\.yahoo\./, "yahoo"], [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
    [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, "chatgpt"], [/(^|\.)perplexity\.ai$/, "perplexity"], [/(^|\.)claude\.ai$/, "claude"]
  ];
  function token(v) {
    if (typeof v !== "string") return undefined;
    v = v.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 40);
    return /^[a-z0-9][a-z0-9._-]{0,39}$/.test(v) ? v : undefined;
  }
  function inApp(ua) {
    if (/Barcelona/i.test(ua)) return "threads";
    if (/Instagram/i.test(ua)) return "instagram";
    if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "facebook";
    if (/\bLine\//i.test(ua)) return "line";
    if (/musical_ly|BytedanceWebview|TikTok/i.test(ua)) return "tiktok";
    if (/Twitter/i.test(ua)) return "x";
    if (/Dcard/i.test(ua)) return "dcard";
    if (/Discord/i.test(ua)) return "discord";
    return null;
  }
  function fromReferrer(ref) {
    if (!ref) return null;
    try {
      var host = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
      if (host === "siao.ai" || /\.siao\.ai$/.test(host)) return "internal";
      for (var i = 0; i < HOSTS.length; i++) if (HOSTS[i][0].test(host)) return HOSTS[i][1];
      return "other";
    } catch (e) { return null; }
  }
  function source(a, ref, ua) {
    if (a.us && UTM[a.us]) return UTM[a.us];
    if (a.f === "story") return "instagram";
    var app = inApp(ua || "");
    if (app) return app;
    var r = fromReferrer(ref);
    if (r && r !== "other") return r;
    if (a.s || a.f) return "share";
    if (a.us) return "other";
    return r || "direct";
  }
  siaoLanding.source = source; // for the parity test
  try {
    var q = new URLSearchParams(location.search);
    var a = {};
    if (CODE.test(q.get("s") || "")) a.s = q.get("s");
    if (CHANNELS.indexOf(q.get("f")) >= 0) a.f = q.get("f");
    var us = token(q.get("utm_source")), um = token(q.get("utm_medium")), uc = token(q.get("utm_campaign"));
    if (us) a.us = us; if (um) a.um = um; if (uc) a.uc = uc;
    var ref = document.referrer ? new URL(document.referrer).origin : "";
    var src = source(a, ref, navigator.userAgent);
    var ft = null, now = Date.now();
    try {
      var kept = JSON.parse(localStorage.getItem("siao.firstTouch") || "null");
      if (kept && typeof kept.at === "number" && now - kept.at <= DAY30 && kept.at <= now && NAMES.indexOf(kept.source) >= 0) ft = kept;
      else if (src !== "internal") {
        ft = { source: src, at: now };
        if (a.s) ft.s = a.s; if (a.f) ft.f = a.f;
        localStorage.setItem("siao.firstTouch", JSON.stringify(ft));
      } else localStorage.removeItem("siao.firstTouch");
    } catch (e) { /* storage refused */ }
    // Out of the address bar: only our-shaped s/f, and utm.
    var url = new URL(location.href), changed = false;
    ["s", "f", "utm_source", "utm_medium", "utm_campaign"].forEach(function (n) {
      var v = url.searchParams.get(n);
      if (v === null) return;
      if (n === "s" && !CODE.test(v)) return;
      if (n === "f" && CHANNELS.indexOf(v) < 0) return;
      url.searchParams.delete(n); changed = true;
    });
    if (changed) history.replaceState(history.state, "", url.toString());
    var out = { a: a };
    if (ft) out.ft = ft;
    return out;
  } catch (e) {
    return {};
  }
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
      // Where this visit came from and who shared the link, if anyone
      // (siaoLanding, above); also takes those parameters off the address.
      ...siaoLanding(),
    });
    navigator.sendBeacon("https://woqu.siao.ai/api/hit", new Blob([body], { type: "text/plain" }));
    // Time on the page: only while it is visible, sent when it is hidden
    // or left. The receiving end keeps it out of Umami.
    let shown = document.visibilityState === "visible" ? Date.now() : null;
    let total = 0;
    const report = () => {
      if (shown !== null) {
        total += Date.now() - shown;
        shown = null;
      }
      if (total >= 1000) {
        const ping = JSON.stringify({ p: location.pathname, k: "engaged", v: Math.round(total) });
        navigator.sendBeacon("https://woqu.siao.ai/api/hit", new Blob([ping], { type: "text/plain" }));
      }
      total = 0;
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") report();
      else shown = Date.now();
    });
    addEventListener("pagehide", report);
  }
} catch (e) {}
