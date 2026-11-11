import type { Page } from "@playwright/test";

/** Resolves once React has attached to <main> (post-hydration signal). */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const main = document.querySelector("main");
    return !!main && Object.keys(main).some((k) => k.startsWith("__reactFiber"));
  });
}

/** On the home page, the carousel's full-bleed style lands after mount. */
export async function waitForCarouselBleed(page: Page) {
  await page
    .locator('[role="region"][aria-roledescription="carousel"][style*="margin-left"]')
    .waitFor();
}

/** Computed blur radii (px) of every element under <main>. */
export async function blurRadii(page: Page): Promise<number[]> {
  return page.$$eval("main *", (els) =>
    els.flatMap((e) => {
      const m = getComputedStyle(e).filter.match(/blur\(([\d.]+)px\)/);
      return m ? [parseFloat(m[1])] : [];
    }),
  );
}
