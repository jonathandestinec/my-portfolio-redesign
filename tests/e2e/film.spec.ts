import { expect, test } from "@playwright/test";

const film = (page: import("@playwright/test").Page) => page.locator("figure.case-film video[data-film]");
const playing = (v: import("@playwright/test").Locator) => v.evaluate((el: HTMLVideoElement) => !el.paused && el.currentTime > 0);

test("each case study plays its film, muted, once on screen", async ({ page }) => {
  for (const slug of ["royal-beads-edo", "huddle", "agrohub"]) {
    await page.goto(`/work/${slug}`);
    const v = film(page);
    await expect(v).toHaveAttribute("src", `/work/${slug}/film/film.mp4`);
    await expect(v).toHaveAttribute("poster", `/work/${slug}/film/poster.jpg`);
    expect(await v.evaluate((el: HTMLVideoElement) => el.muted && el.loop && el.playsInline)).toBe(true);
    await v.scrollIntoViewIfNeeded();
    await expect.poll(() => playing(v), { timeout: 10_000 }).toBe(true);
  }
});

test("with reduced motion the film stays on its poster", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/work/royal-beads-edo");
  const v = film(page);
  await v.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  expect(await v.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
  await ctx.close();
});

test("only the current carousel slide plays", async ({ page }) => {
  await page.goto("/");
  const region = page.getByRole("region", { name: "Selected work" });
  await region.scrollIntoViewIfNeeded();
  const vids = region.locator("video[data-film]");
  await expect(vids).toHaveCount(3);
  await expect.poll(() => playing(vids.nth(0)), { timeout: 10_000 }).toBe(true);
  expect(await vids.nth(1).evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
});
