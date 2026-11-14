import { expect, test, type Page } from "@playwright/test";
import { waitForHydration } from "./helpers";

const blurredCount = (page: Page) =>
  page.$$eval("main *, footer", (els) =>
    els.filter((e) => /blur\(/.test(getComputedStyle(e).filter)).length,
  );

test.describe("blur reveal (motion allowed)", () => {
  test.use({ reducedMotion: "no-preference" });

  test("content below the fold starts blurred, sharpens once on scroll, and stays sharp", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    // Nothing on screen at load is blurred: no film over the edges.
    const onScreen = await page.$$eval(".reveal", (els) =>
      els.filter((e) => e.getBoundingClientRect().top < innerHeight).length,
    );
    expect(onScreen).toBe(0);
    const target = page.locator("#education .section__head");
    await expect(target).toHaveClass(/reveal/);
    await target.scrollIntoViewIfNeeded();
    await expect(target).not.toHaveClass(/reveal/, { timeout: 3000 });
    // Scroll back past it: it does not blur again.
    await page.mouse.wheel(0, -3000);
    await page.waitForTimeout(300);
    await expect(target).not.toHaveClass(/reveal/);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  for (const path of ["/", "/work/agrohub"])
    test(`no blur at all on ${path}`, async ({ page }) => {
      await page.goto(path);
      await waitForHydration(page);
      await page.mouse.wheel(0, 1500);
      await page.waitForTimeout(300);
      expect(await blurredCount(page)).toBe(0);
      expect(await page.locator(".reveal").count()).toBe(0);
    });
});
