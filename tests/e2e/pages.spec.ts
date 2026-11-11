import { expect, test } from "@playwright/test";

test("agrohub case study", async ({ page, isMobile }) => {
  await page.goto("/work/agrohub");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("AgroHub");
  await expect(page.getByRole("link", { name: /Live/ })).toHaveAttribute(
    "href",
    "https://agrohub-theta.vercel.app",
  );
  await expect(page.getByText("Next project")).toHaveCount(0);
  // On phones the back link lives in the menu sheet.
  if (!isMobile) {
    await expect(
      page.getByRole("link", { name: "← Destine Jonathan" }),
    ).toBeVisible();
  }
});

test("playground groups", async ({ page }) => {
  await page.goto("/playground");
  await expect(
    page.getByRole("heading", { name: "Client & collaborations" }),
  ).toBeVisible();
  await expect(page.getByText("Thymus Energy FZCO")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Experiments", exact: true })).toBeVisible();
});

test("unknown work 404s", async ({ page }) => {
  expect((await page.goto("/work/nope"))!.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nothing here.");
});

test("unknown playground path 404s", async ({ page }) => {
  expect((await page.goto("/playground/x"))!.status()).toBe(404);
});
