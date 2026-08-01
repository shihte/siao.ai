/* A refresh is a fresh visit, not a return to wherever you'd scrolled to —
 * the browser's own scroll restoration disagrees, so turn it off. Must run
 * before anything else, synchronously, or the restore already happened. */
history.scrollRestoration = "manual";

/* The exits.
 *
 * Add a subdomain by adding one entry. Nothing else needs to change.
 *
 *   { name: "git.siao.ai", url: "https://git.siao.ai", live: true }
 *
 * live: false renders as plain grey text with no link, so a place that
 * isn't up yet can't send anyone to a 404.
 */
const PLACES = [
  { name: "git.siao.ai", url: "https://git.siao.ai", desc: "code & repositories", live: true },
  { name: "app.siao.ai", url: "https://app.siao.ai", desc: "web applications & tools", live: true },
];

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
      desc.textContent = place.desc;
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
      desc.textContent = place.desc;
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
