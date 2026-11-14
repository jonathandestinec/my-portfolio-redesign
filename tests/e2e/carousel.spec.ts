import { expect, test, type Page } from "@playwright/test";
import { waitForHydration } from "./helpers";

const region = (page: Page) => page.getByRole("region", { name: "Selected work" });
const label = (page: Page) => page.locator(".frame__label");

async function ready(page: Page) {
  await page.goto("/");
  await waitForHydration(page);
  await region(page).scrollIntoViewIfNeeded();
}

test("the frame and label stay put; the slides move under them", async ({ page }) => {
  await ready(page);
  const before = (await page.locator(".frame").boundingBox())!;
  await expect(label(page)).toHaveText("Huddle");
  await page.locator(".track").focus();
  await page.keyboard.press("ArrowRight");
  await expect(label(page)).toHaveText("AgroHub");
  const after = (await page.locator(".frame").boundingBox())!;
  expect(after.x).toBe(before.x);
  // The newly current slide ends up exactly under the frame.
  await expect
    .poll(async () => Math.round((await page.locator(".slide.is-current").boundingBox())!.x))
    .toBe(Math.round(after.x));
});

test("the frame is centred in the viewport", async ({ page }) => {
  await ready(page);
  const f = (await page.locator(".frame").boundingBox())!;
  const vw = page.viewportSize()!.width;
  expect(Math.abs(f.x + f.width / 2 - vw / 2)).toBeLessThanOrEqual(1);
});

test("dragging moves to the next slide without navigating", async ({ page }) => {
  await ready(page);
  const url = page.url();
  const box = (await page.locator(".frame").boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + 80);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.1, box.y + 80, { steps: 10 });
  await page.mouse.up();
  await expect(label(page)).toHaveText("AgroHub");
  expect(page.url()).toBe(url);
});

test("clicking a peeking slide only brings it in", async ({ page, isMobile }) => {
  test.skip(isMobile, "neighbours barely peek on phones");
  await ready(page);
  const url = page.url();
  const next = page.locator(".slide").nth(1);
  const b = (await next.boundingBox())!;
  await page.mouse.click(b.x + 30, b.y + 60);
  await expect(label(page)).toHaveText("AgroHub");
  expect(page.url()).toBe(url);
});

test("non-current slides are dimmed", async ({ page }) => {
  await ready(page);
  await expect(page.locator(".slide").nth(1).locator(".slide__cover")).toHaveCSS("opacity", "0.6");
  await expect(page.locator(".slide.is-current .slide__cover")).toHaveCSS("opacity", "1");
});

test("clicking the current slide or its label opens the case study", async ({ page }) => {
  await ready(page);
  await label(page).click();
  await expect(page).toHaveURL(/\/work\/huddle$/);
  await ready(page);
  const f = (await page.locator(".frame").boundingBox())!;
  await page.mouse.click(f.x + f.width / 2, f.y + f.height / 2);
  await expect(page).toHaveURL(/\/work\/huddle$/);
});

test("a horizontal trackpad swipe moves one slide; vertical wheel scrolls the page", async ({ page, isMobile }) => {
  test.skip(isMobile, "wheel gestures are a desktop input");
  await ready(page);
  const f = (await page.locator(".frame").boundingBox())!;
  await page.mouse.move(f.x + f.width / 2, f.y + f.height / 2);
  // A long swipe with momentum still moves exactly one slide.
  for (let i = 0; i < 12; i++) await page.mouse.wheel(40, 0);
  await expect(label(page)).toHaveText("AgroHub");
  await page.waitForTimeout(300);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(-40, 0);
  await expect(label(page)).toHaveText("Huddle");
  const y0 = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(y0);
  await expect(label(page)).toHaveText("Huddle");
});

test("there are no carousel buttons", async ({ page }) => {
  await ready(page);
  await expect(region(page).getByRole("button")).toHaveCount(0);
});
