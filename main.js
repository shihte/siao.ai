/* A refresh is a fresh visit, not a return to wherever you'd scrolled to —
 * the browser's own scroll restoration disagrees, so turn it off. Must run
 * before anything else, synchronously, or the restore already happened. */
history.scrollRestoration = "manual";

/* The exits.
 *
 * Add a subdomain by adding one entry. Nothing else needs to change — not the
 * layout, and not the Chinese page, which renders from this same array.
 *
 *   { name: "git.siao.ai", url: "https://git.siao.ai",
 *     desc: { en: "…", zh: "…" }, live: true }
 *
 * live: false renders as plain grey text with no link, so a place that
 * isn't up yet can't send anyone to a 404.
 *
 * The descriptions are sentences, not labels: "code & repositories" told a
 * visitor nothing they couldn't guess from the word "git".
 */
const PLACES = [
  {
    name: "git.siao.ai",
    url: "https://git.siao.ai",
    desc: {
      en: "a self-hosted git server, and a front end written for it",
      zh: "自架的 git 伺服器，以及為它寫的前台",
    },
    live: true,
  },
  {
    name: "apps.siao.ai",
    url: "https://apps.siao.ai",
    desc: {
      en: "web applications, running on the same machine",
      zh: "跑在同一台機器上的網頁應用",
    },
    live: true,
  },
];

/* Which language this copy of the page is. The document says so already —
 * asking it is cheaper than keeping a second record that can disagree. */
const LANG = document.documentElement.lang.startsWith("zh") ? "zh" : "en";

const list = document.getElementById("places");

for (const place of PLACES) {
  const li = document.createElement("li");
  if (place.live) {
    const a = document.createElement("a");
    a.href = place.url;

    const info = document.createElement("span");
    info.className = "place-info";

    const name = document.createElement("span");
    name.className = "place-name";
    name.textContent = place.name;
    info.append(name);

    if (place.desc) {
      const desc = document.createElement("span");
      desc.className = "place-desc";
      desc.textContent = place.desc[LANG];
      info.append(desc);
    }

    a.append(info);
    li.append(a);
  } else {
    const info = document.createElement("span");
    info.className = "place-info";

    const name = document.createElement("span");
    name.className = "place-name";
    name.textContent = place.name;
    info.append(name);

    if (place.desc) {
      const desc = document.createElement("span");
      desc.className = "place-desc";
      desc.textContent = place.desc[LANG];
      info.append(desc);
    }

    li.append(info);
  }
  list.append(li);
}

/* Stay on the card long enough and the page moves on for you. Any sign of
 * intent from the visitor — scroll, touch, a key — cancels it for good;
 * once you've touched the page yourself, it doesn't try to steer again. */
const HOLD_MS = 4000;

const stillness = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!stillness.matches) {
  let timer = setTimeout(() => {
    if (window.scrollY < 50) {
      document.querySelector(".exits").scrollIntoView({ behavior: "smooth" });
    }
  }, HOLD_MS);

  const cancel = () => clearTimeout(timer);
  addEventListener("wheel", cancel, { passive: true, once: true });
  addEventListener("touchstart", cancel, { passive: true, once: true });
  addEventListener("keydown", cancel, { once: true });
  addEventListener("pointerdown", cancel, { passive: true, once: true });
}

/* Taking the switch is a decision, and decisions get remembered. Everything
 * else about the link works without this — it is a real href to a real page —
 * so a visitor whose storage is unavailable simply gets asked again next
 * time, rather than getting nothing. */
const switcher = document.querySelector(".lang-switch a");

if (switcher) {
  switcher.addEventListener("click", () => {
    try {
      localStorage.setItem("lang", switcher.getAttribute("lang").startsWith("zh") ? "zh" : "en");
    } catch (e) {}
  });
}
