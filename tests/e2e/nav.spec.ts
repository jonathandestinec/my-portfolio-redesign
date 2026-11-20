import { expect, test } from "@playwright/test";

const pages: [string, string][] = [
  ["Works", "/works"],
  ["Experience", "/experience"],
  ["Education", "/education"],
  ["Stack", "/stack"],
  ["Writing", "/blog"],
  ["Contact", "/contact"],
];

test("every sidebar link opens its own page and is marked current", async ({ page, isMobile }) => {
  test.skip(isMobile, "the sidebar is desktop-only");
  for (const [name, path] of pages) {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await nav.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(
      page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
});

test("sidebar is fixed beside the column and hides over the work strip", async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto("/");
  const nav = page.locator('nav[aria-label="Primary"]');
  await expect(nav).toHaveCSS("position", "fixed");
  await page.locator(".strip").evaluate((e) => e.scrollIntoView({ block: "center" }));
  await expect(nav).toHaveCSS("opacity", "0");
  await expect(nav).toHaveAttribute("inert", "");
});

test("page links never light up for home sections; chapter links do", async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto("/");
  await page.locator("#education").evaluate((e) => e.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(300);
  await expect(page.locator('nav[aria-label="Primary"] [data-in-view]')).toHaveCount(0);
  await page.goto("/work/huddle");
  await page.locator("#payments").evaluate((e) => e.scrollIntoView({ block: "center" }));
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Money goes straight to the organisation" })).toHaveAttribute("data-in-view", "");
  await expect(nav.getByRole("link", { name: "Experience", exact: true })).not.toHaveAttribute("data-in-view", "");
});

test("phone top bar is transparent and scrolls away", async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto("/");
  const bar = page.getByRole("navigation", { name: "Mobile" });
  await expect(bar).toHaveCSS("position", "static");
  await expect(bar).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await page.mouse.wheel(0, 800);
  await expect
    .poll(async () => (await bar.boundingBox())!.y)
    .toBeLessThan(-50);
});

test("mobile menu links go to pages", async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Education" }).click();
  await expect(page).toHaveURL(/\/education$/);
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("mobile menu opens and closes", async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Menu" });
  await menu.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(menu).toBeFocused();
});

test("mobile menu traps focus", async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(
      () => !!document.activeElement?.closest('[role="dialog"]'),
    );
    expect(inside).toBe(true);
  }
});
