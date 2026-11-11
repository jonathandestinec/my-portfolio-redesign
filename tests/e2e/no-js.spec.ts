import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

test("home readable without JS", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1, [data-hero-lead]").first()).toBeVisible();
  const hidden = await page.$$eval(
    "main *",
    (els) =>
      els.filter((e) => {
        const cs = getComputedStyle(e);
        return cs.filter !== "none" || !(parseFloat(cs.opacity) >= 1);
      }).length,
  );
  expect(hidden).toBe(0);
});

test("contact section links exist without JS", async ({ page }) => {
  await page.goto("/");
  const contact = page.locator("#contact");
  const expected: [string, string][] = [
    ["Résumé", "/resume.pdf"],
    ["GitHub", "https://github.com/jonathandestinec"],
    ["LinkedIn", "https://linkedin.com/in/jonathandestinec"],
    ["X", "https://x.com/destine0_"],
  ];
  for (const [name, href] of expected) {
    const a = contact.getByRole("link", { name, exact: true });
    await expect(a).toHaveCount(1);
    await expect(a).toHaveAttribute("href", href);
  }
  await expect(contact.getByRole("link", { name: "Résumé" })).toHaveAttribute("download", "");
});
