/* The exits.
 *
 * Add a subdomain by adding one entry. Nothing else needs to change —
 * not the layout, not the animation.
 *
 *   { name: "git.siao.ai", url: "https://git.siao.ai", live: true }
 *
 * live: false renders as plain grey text with no link, so a place that
 * isn't up yet can't send anyone to a 404.
 */
const PLACES = [];

const list = document.getElementById("places");

for (const place of PLACES) {
  const li = document.createElement("li");
  if (place.live) {
    const a = document.createElement("a");
    a.href = place.url;
    a.textContent = place.name;
    li.append(a);
  } else {
    li.textContent = place.name;
  }
  list.append(li);
}

/* ------------------------------------------------------------------ *
 * The act
 *
 * CSS owns the geometry and the choreography; this file owns only two
 * things — when the act begins, and when to get out of the way.
 * ------------------------------------------------------------------ */

const root = document.documentElement;
const first = document.querySelector(".viewport-one");

const ms = (name) => {
  const v = getComputedStyle(root).getPropertyValue(name).trim();
  return v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000;
};

const stillness = window.matchMedia("(prefers-reduced-motion: reduce)");

/* Someone who has already sat through the wait once should not sit
 * through all of it again. */
if (sessionStorage.getItem("seen")) root.style.setProperty("--hold", "1.2s");
sessionStorage.setItem("seen", "1");

let pending = null;
let gliding = null;
let handedOver = false;

function yield_() {
  handedOver = true;
  clearTimeout(pending);
  pending = null;
  if (gliding !== null) cancelAnimationFrame(gliding);
  gliding = null;
}

/* Because the exits are carried down by the blow rather than laid out where
 * they end up, arriving early means arriving at nothing. So if the visitor
 * has taken the wheel and gone looking, stop performing and put everything
 * where it lands. An empty screen is a worse answer than a spoiled trick. */
function settle() {
  for (const a of document.getAnimations()) a.finish();
}

/* The blow sends everything downwards; the view goes with it. Easing out
 * of that momentum rather than into it is what makes it read as one
 * motion instead of two. */
function glide() {
  const from = window.scrollY;
  const to = window.innerHeight;
  const span = 900;
  const start = performance.now();

  const step = (now) => {
    const p = Math.min((now - start) / span, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    window.scrollTo(0, from + (to - from) * eased);
    gliding = p < 1 ? requestAnimationFrame(step) : null;
  };
  gliding = requestAnimationFrame(step);
}

function play() {
  yield_();
  handedOver = false;
  document.body.classList.remove("act");
  void document.body.offsetWidth; // reflow, so the animations restart
  document.body.classList.add("act");
  pending = setTimeout(glide, ms("--fade-in") + ms("--hold") + ms("--impact"));
}

/* Any sign of intent from the visitor and the page stops steering. */
const SCROLL_KEYS = new Set([
  "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ",
]);

addEventListener("wheel", yield_, { passive: true });
addEventListener("touchstart", yield_, { passive: true });
addEventListener("pointerdown", yield_, { passive: true });
addEventListener("keydown", (e) => { if (SCROLL_KEYS.has(e.key)) yield_(); });

if (!stillness.matches) {
  /* Only now do the exits move above the fold. Until this class exists they
   * are laid out a viewport down, where someone without JS can still find
   * them. */
  root.classList.add("motion");

  /* Looking at the first viewport is the only cue the act needs — it covers
   * the first visit and every return alike. */
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) play();
      else {
        clearTimeout(pending);
        if (handedOver) settle();
      }
    },
    { threshold: 0.95 }
  ).observe(first);
}
