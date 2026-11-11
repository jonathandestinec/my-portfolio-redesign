import { expect, test } from "@playwright/test";
import { blurRadii, waitForCarouselBleed, waitForHydration } from "./helpers";

const paths = ["/", "/work/agrohub"];

async function settle(page: import("@playwright/test").Page, path: string) {
  await page.goto(path);
  await waitForHydration(page);
  if (path === "/") await waitForCarouselBleed(page);
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(400);
}

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  for (const path of paths)
    test(`no blur under reduced motion on ${path}`, async ({ page }) => {
      await settle(page, path);
      // Any blur( at all, including blur(0px), means ScrollBlur animated.
      const blurred = await page.$$eval(
        "main *",
        (els) => els.filter((e) => /blur\(/.test(getComputedStyle(e).filter)).length,
      );
      expect(blurred).toBe(0);
    });
});

test.describe("motion allowed (positive control)", () => {
  test.use({ reducedMotion: "no-preference" });
  for (const path of paths)
    test(`blur is applied after scrolling on ${path}`, async ({ page }) => {
      await settle(page, path);
      // blur(0px) is the at-rest value, so count only a real radius.
      const radii = await blurRadii(page);
      expect(radii.filter((r) => r > 0).length).toBeGreaterThan(0);
    });
});
