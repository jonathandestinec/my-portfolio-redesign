import { expect, test, type Page } from "@playwright/test";

const region = (page: Page) =>
  page.getByRole("region", { name: "AgroHub screens" });

test("arrow keys move active slide", async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto("/");
  await region(page).focus();
  await page.keyboard.press("ArrowRight");
  await expect(region(page).locator('[aria-current="true"]')).toContainText(
    "Browse lots",
  );
});

test("prev/next buttons move slides and disable at the ends", async ({
  page,
}) => {
  await page.goto("/");
  const prev = page.getByRole("button", { name: "Previous slide" });
  const next = page.getByRole("button", { name: "Next slide" });
  await expect(prev).toBeDisabled();
  await next.click();
  await expect(region(page).locator('[aria-current="true"]')).toContainText(
    "Browse lots",
  );
  await expect(prev).toBeEnabled();
  await next.click();
  await next.click();
  await expect(region(page).locator('[aria-current="true"]')).toContainText(
    "Landing on a phone",
  );
  await expect(next).toBeDisabled();
});

// Needs /work/agrohub, which arrives with Task 13.
test.fixme("click active card opens case study", async ({ page }) => {
  await page.goto("/");
  await region(page).locator('[aria-current="true"] a').click();
  await expect(page).toHaveURL(/\/work\/agrohub$/);
});

test("swipe on touch moves slide", async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto("/");
  const urlBefore = page.url();
  // On a phone the carousel starts below the fold; mouse events need it on screen.
  await region(page).scrollIntoViewIfNeeded();
  const box = (await region(page).boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.1, box.y + 100, { steps: 8 });
  await page.mouse.up();
  await expect(region(page).locator('[aria-current="true"]')).toContainText(
    "Browse lots",
  );
  expect(page.url()).toBe(urlBefore);
});

test("tabbing to a slide link moves the carousel to it", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect
    .poll(async () => (await region(page).boundingBox())!.x)
    .toBeLessThanOrEqual(1);
  await region(page).focus();
  const third = region(page).getByRole("link", { name: "AgroHub · Price board" });
  for (let i = 0; i < 4 && !(await third.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(third).toBeFocused();
  await expect(region(page).locator('[aria-current="true"]')).toContainText(
    "Price board",
  );
  // Let the spring settle, then check centring.
  await expect
    .poll(async () => {
      const b = (await third.boundingBox())!;
      return Math.abs(b.x + b.width / 2 - 720);
    })
    .toBeLessThanOrEqual(2);
});

test("carousel is full bleed and the active card is centred", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  // Bleed is applied after mount, so poll.
  await expect
    .poll(async () => (await region(page).boundingBox())!.x)
    .toBeLessThanOrEqual(1);
  const r = (await region(page).boundingBox())!;
  expect(r.width).toBeGreaterThanOrEqual(1438);
  const card = (await region(page)
    .locator('[aria-current="true"] a')
    .boundingBox())!;
  expect(Math.abs(card.x + card.width / 2 - 720)).toBeLessThanOrEqual(2);
});
