import { expect, test } from "@playwright/test";

test("hover reveals chips", async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto("/");
  await page.getByRole("link", { name: "Book a call" }).hover();
  await expect(page.getByRole("link", { name: "Email" })).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: /Résumé/ }),
  ).toHaveAttribute("href", "/resume.pdf");
});

test("keyboard focus reveals, Escape hides", async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto("/");
  await page.getByRole("link", { name: "Book a call" }).focus();
  await expect(page.getByRole("link", { name: "Email" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("link", { name: "Email" })).toBeHidden();
});

test("touch: first tap reveals, does not navigate", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile);
  await page.goto("/");
  await page.getByRole("link", { name: "Book a call" }).tap();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Email" })).toBeVisible();
});
