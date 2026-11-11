import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

test("home readable without JS", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1, [data-hero-lead]").first()).toBeVisible();
  const hidden = await page.$$eval(
    "main *",
    (els) => els.filter((e) => getComputedStyle(e).opacity === "0").length,
  );
  expect(hidden).toBe(0);
});
