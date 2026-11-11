import { expect, test, type Page } from "@playwright/test";
import { waitForHydration } from "./helpers";

const paths = [
  "/",
  "/works",
  "/experience",
  "/education",
  "/stack",
  "/contact",
  "/work/agrohub",
  "/blog",
  "/blog/agrohub-payment-held-until-delivery",
];

async function ready(page: Page, path: string) {
  await page.goto(path);
  await waitForHydration(page);
}

const docOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

// body{overflow-x:clip} can hide overflow from scrollWidth, so also check each
// element. Skipped by design: the full-bleed work strip (.strip) and
// anything inside a box that scrolls or clips its own overflow (code blocks).
const overflowing = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("main *")]
      .filter((e) => !e.closest(".strip"))
      .filter((e) => {
        for (let p = e.parentElement; p && p.tagName !== "MAIN"; p = p.parentElement) {
          if (getComputedStyle(p).overflowX !== "visible") return false;
        }
        return true;
      })
      .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
      .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 60)}`),
  );

for (const path of paths)
  test(`no horizontal overflow on ${path}`, async ({ page }) => {
    await ready(page, path);
    expect(await docOverflow(page)).toBeLessThanOrEqual(0);
    expect(await overflowing(page)).toEqual([]);
  });

test.describe("800x900", () => {
  test.use({ viewport: { width: 800, height: 900 } });
  test.skip(({ isMobile }) => isMobile, "tablet width runs on desktop project");
  for (const path of ["/", "/work/agrohub"])
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await ready(page, path);
      expect(await docOverflow(page)).toBeLessThanOrEqual(0);
      expect(await overflowing(page)).toEqual([]);
    });
});

test("overflow check has teeth", async ({ page }) => {
  await ready(page, "/blog");
  await page.evaluate(() => {
    const d = document.createElement("div");
    d.style.cssText = "width:2000px;height:10px";
    document.querySelector("main")!.append(d);
  });
  expect((await overflowing(page)).length).toBeGreaterThan(0);
});
