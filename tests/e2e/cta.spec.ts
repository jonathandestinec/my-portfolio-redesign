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
  const pill = page.getByRole("link", { name: "Book a call" });
  let popups = 0;
  page.on("popup", () => popups++);
  await pill.tap();
  await page.waitForTimeout(800);
  expect(popups).toBe(0);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Email" })).toBeVisible();
  const popup = page.waitForEvent("popup", { timeout: 5000 });
  await pill.tap();
  await popup;
  expect(popups).toBe(1);
});

test("escape from a chip returns focus to the pill", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile);
  await page.goto("/");
  await page.getByRole("link", { name: "Book a call" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Email" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("link", { name: "Email" })).toBeHidden();
  await expect(page.getByRole("link", { name: "Book a call" })).toBeFocused();
});
