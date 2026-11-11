import { expect, test } from "@playwright/test";

test("agrohub case study", async ({ page, isMobile }) => {
  await page.goto("/work/agrohub");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("AgroHub");
  await expect(page.getByRole("link", { name: /Live/ })).toHaveAttribute(
    "href",
    "https://agrohub-theta.vercel.app",
  );
  await expect(page.getByText("Next project")).toHaveCount(0);
  // The timeline stays hidden until the owner confirms the phases.
  await expect(page.getByText("How it's shipping")).toHaveCount(0);
  // On phones the back link lives in the menu sheet.
  if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
  await expect(
    page.getByRole("link", { name: "← Destine Jonathan" }),
  ).toBeVisible();
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

test("resume pdf downloads", async ({ request }) => {
  const res = await request.get("/resume.pdf");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  expect(res.headers()["content-disposition"]).toContain("attachment");
  expect((await res.body()).subarray(0, 4).toString()).toBe("%PDF");
});
