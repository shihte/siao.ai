import { test, expect } from "@playwright/test";

/* Guessing a visitor's language from their browser is only safe if guessing
 * wrong is cheap to undo. These tests are that promise, written down: the
 * guess happens once, a person's own choice outranks it forever after, and
 * the way to make that choice is on screen the moment the page opens. */

test.describe("arriving with a Chinese browser", () => {
  test.use({ locale: "zh-TW" });

  test("the front door leads to the Chinese page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/zh\/$/);
    await expect(page.locator(".statement")).toHaveText("山頂是謊言。巨石是真的。");
  });

  test("a Chinese address is never bounced anywhere", async ({ page }) => {
    await page.goto("/zh/");
    await expect(page).toHaveURL(/\/zh\/$/);
  });
});

test.describe("arriving with an English browser", () => {
  test.use({ locale: "en-US" });

  test("the front door stays where it is", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".statement")).toHaveText(
      "The summit is a lie. The boulder is real."
    );
  });

  test("the Chinese page is still reachable on purpose", async ({ page }) => {
    await page.goto("/zh/");
    await expect(page).toHaveURL(/\/zh\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hant");
  });
});

test.describe("once you have said which language you want", () => {
  test.use({ locale: "zh-TW" });

  test("your choice outranks your browser, on every later visit", async ({
    page,
  }) => {
    await page.goto("/"); // guessed: Chinese
    await expect(page).toHaveURL(/\/zh\/$/);

    await page.getByRole("link", { name: "EN" }).click(); // corrected by hand
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/"); // and it stays corrected
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("choosing Chinese is remembered just the same", async ({ page }) => {
    await page.goto("/zh/");
    await page.getByRole("link", { name: "EN" }).click();
    await page.getByRole("link", { name: "中文" }).click();
    await expect(page).toHaveURL(/\/zh\/$/);

    await page.goto("/");
    await expect(page).toHaveURL(/\/zh\/$/);
  });
});

test.describe("the switch itself", () => {
  test("is on screen the moment the page opens", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "中文" })).toBeInViewport();
  });

  test("is the first thing a keyboard reaches", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "中文" })).toBeFocused();
  });

  test("does not follow you down the page", async ({ page }) => {
    await page.goto("/");
    await page.locator(".colophon").scrollIntoViewIfNeeded();
    await expect(page.getByRole("link", { name: "中文" })).not.toBeInViewport();
  });

  test("points at the other language, and says so to a machine", async ({
    page,
  }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: "中文" });
    await expect(link).toHaveAttribute("href", "/zh/");
    await expect(link).toHaveAttribute("hreflang", "zh-Hant");
    await expect(link).toHaveAttribute("lang", "zh-Hant");
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false, locale: "zh-TW" });

  test("the English page still reads, and the switch still works", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/); // no guess is better than a broken guess
    await expect(page.locator("h1")).toHaveText("Siao");
    await expect(page.locator(".colophon")).toContainText("Hand-written HTML");
    await expect(page.locator(".email a")).toHaveAttribute(
      "href",
      "mailto:hello@siao.ai"
    );

    await page.getByRole("link", { name: "中文" }).click();
    await expect(page).toHaveURL(/\/zh\/$/);
    await expect(page.locator(".statement")).toHaveText("山頂是謊言。巨石是真的。");
  });
});
