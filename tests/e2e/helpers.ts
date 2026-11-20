import type { Page } from "@playwright/test";

/** Resolves once React has attached to <main> (post-hydration signal). */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const main = document.querySelector("main");
    return !!main && Object.keys(main).some((k) => k.startsWith("__reactFiber"));
  });
}

/** Scrolls the whole page in wheel steps so every reveal fires. */
export async function scrollThrough(page: Page) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 400) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(40);
  }
}
