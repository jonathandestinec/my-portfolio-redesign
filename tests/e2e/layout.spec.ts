import { expect, test } from "@playwright/test";

for (const path of [
  "/",
  "/work/agrohub",
  "/playground",
  "/blog",
  "/blog/agrohub-payment-held-until-delivery",
])
  test(`no horizontal scroll on ${path}`, async ({ page }) => {
    await page.goto(path);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(0);
  });
