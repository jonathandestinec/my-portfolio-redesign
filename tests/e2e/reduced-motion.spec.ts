import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

test("no blur under reduced motion", async ({ page }) => {
  await page.goto("/work/agrohub");
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(300);
  const blurred = await page.$$eval(
    "main *",
    (els) => els.filter((e) => /blur\(/.test(getComputedStyle(e).filter)).length,
  );
  expect(blurred).toBe(0);
});
