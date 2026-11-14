import { expect, test } from "@playwright/test";

test("home responds 200 and has an h1", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toBeVisible();
});
