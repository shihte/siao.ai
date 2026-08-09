import { test, expect } from "@playwright/test";

/* The third act. What it must say is one thing; where it sits relative to the
 * exits is another, and the second is the part that is easy to break later —
 * a colophon that drifts above the links, or that the page starts scrolling
 * people to, has stopped being a colophon. */

test("the exits say what each place actually is", async ({ page }) => {
  await page.goto("/");
  const descs = page.locator(".places .place-desc");
  await expect(descs.nth(0)).toHaveText(
    "a self-hosted git server, and a front end written for it"
  );
  await expect(descs.nth(1)).toHaveText(
    "web applications, running on the same machine"
  );
});

test("the colophon states how the site is made and run", async ({ page }) => {
  await page.goto("/");
  const colophon = page.locator(".colophon");
  await expect(colophon.locator(".eyebrow")).toHaveText("colophon");
  await expect(colophon).toContainText("Hand-written HTML");
  await expect(colophon).toContainText("No framework, no build step");
  await expect(colophon).toContainText("an identity system with no passwords");
  await expect(colophon).toContainText("a mail server");
});

test("the colophon comes after the exits, not before them", async ({ page }) => {
  await page.goto("/");
  const order = await page.evaluate(() => {
    const sections = [...document.querySelectorAll("main > section")];
    return sections.map((s) => s.className.split(" ")[0]);
  });
  expect(order).toEqual(["card", "exits", "colophon"]);
});

test("the colophon claims nothing about a person", async ({ page }) => {
  await page.goto("/");
  const text = await page.locator(".colophon").innerText();
  expect(text).not.toMatch(/\b\d{1,2}\s*(years?|歲)\b/i);
});
