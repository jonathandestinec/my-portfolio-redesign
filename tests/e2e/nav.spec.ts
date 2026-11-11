import { expect, test } from "@playwright/test";

test("active link follows scroll", async ({ page, isMobile }) => {
  test.skip(isMobile, "links live in the mobile sheet on phones");
  await page.goto("/");
  await page.locator("#experience").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await expect(page.getByRole("link", { name: "Experience" })).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test("nav hides over works", async ({ page, isMobile }) => {
  test.skip(isMobile, "SideNav is hidden below md");
  await page.goto("/");
  await page
    .locator("#works")
    .evaluate((e) => e.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(500);
  const nav = page.locator('nav[aria-label="Primary"]');
  await expect(nav).toHaveCSS("opacity", "0");
  await expect(nav).toHaveAttribute("inert", "");
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
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(
      () => !!document.activeElement?.closest('[role="dialog"]'),
    );
    expect(inside).toBe(true);
  }
});
