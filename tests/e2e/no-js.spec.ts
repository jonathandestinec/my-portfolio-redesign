import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

for (const path of ["/", "/experience", "/work/agrohub"])
  test(`${path} is fully visible without JS (nothing waits on the reveal)`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    const hidden = await page.$$eval(
      "main *, footer *",
      (els) =>
        els.filter((e) => {
          if (e.closest(".note, .frame__name, .slide, .hero-sticker")) return false; // decorative animations, dimmed slides, sticker shadows
          const cs = getComputedStyle(e);
          return cs.filter !== "none" || !(parseFloat(cs.opacity) >= 1);
        }).length,
    );
    expect(hidden).toBe(0);
  });

test("experience cards open without JS", async ({ page }) => {
  await page.goto("/experience");
  const card = page.locator("#giz");
  await card.locator("summary").click();
  await expect(card.locator(".entry__more")).toBeVisible();
});

test("contact links exist without JS", async ({ page }) => {
  await page.goto("/contact");
  const expected: [RegExp, string][] = [
    [/Download PDF/, "/resume.pdf"],
    [/github\.com\/jonathandestinec/, "https://github.com/jonathandestinec"],
    [/linkedin\.com/, "https://linkedin.com/in/jonathandestinec"],
    [/x\.com/, "https://x.com/destine0_"],
  ];
  const main = page.locator("main");
  for (const [name, href] of expected) {
    await expect(main.getByRole("link", { name })).toHaveAttribute("href", href);
  }
});
