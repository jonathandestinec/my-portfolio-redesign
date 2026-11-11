import { expect, test } from "@playwright/test";

test("home sections render in order", async ({ page }) => {
  await page.goto("/");
  const ids = await page.$$eval("main section[id]", (s) => s.map((e) => e.id));
  expect(ids).toEqual([
    "works",
    "experience",
    "stack",
    "activity",
    "writing",
    "contact",
  ]);
});

test("nav click scrolls and activates", async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto("/");
  await page.getByRole("link", { name: "Stack" }).click();
  await page.waitForTimeout(600);
  await expect(page.getByRole("link", { name: "Stack" })).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test("experience lists Welup first", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#experience li").first()).toContainText(
    "Welup Digital",
  );
});

test("pet projects link", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Pet projects/ }).click();
  await expect(page).toHaveURL(/\/playground$/);
});
