/* The exits.
 *
 * Add a subdomain by adding one entry. Nothing else needs to change.
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
