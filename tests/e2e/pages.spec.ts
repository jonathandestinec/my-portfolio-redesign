import { expect, test } from "@playwright/test";
import { waitForHydration } from "./helpers";

test("agrohub case study follows the reference case layout", async ({ page, isMobile }) => {
  await page.goto("/work/agrohub");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /^AgroHub: farmer cooperatives sell together/,
  );
  await expect(page.locator(".facts")).toContainText("What I did");
  await expect(page.getByRole("link", { name: "agrohub-theta.vercel.app" })).toHaveAttribute(
    "href",
    "https://agrohub-theta.vercel.app",
  );
  for (const t of ["Selling together", "Paid on delivery", "Built for phones"])
    await expect(page.getByRole("heading", { level: 2, name: t })).toBeVisible();
  await expect(page.getByText("Next project")).toHaveCount(0);
  await expect(page.getByText("How it's shipping")).toHaveCount(0);
  if (isMobile) await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("link", { name: "← All works" }).first()).toBeVisible();
});

test("works page: featured card plus client and experiment lists", async ({ page }) => {
  await page.goto("/works");
  await expect(page.getByRole("link", { name: "Read the case study" })).toHaveAttribute(
    "href",
    "/work/agrohub",
  );
  await expect(page.getByRole("heading", { name: "Client & collaborations" })).toBeVisible();
  await expect(page.getByText("Thymus Energy FZCO")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Experiments", exact: true })).toBeVisible();
});

test("/playground redirects to /works", async ({ page }) => {
  await page.goto("/playground");
  await expect(page).toHaveURL(/\/works$/);
});

test("experience page opens the card named in the hash", async ({ page }) => {
  await page.goto("/experience#nexorra-studio");
  await waitForHydration(page);
  const card = page.locator("#nexorra-studio");
  await expect(card).toHaveAttribute("open", "");
  await expect(card.locator(".chips")).toContainText("Socket.io");
});

test("education, stack and contact pages render", async ({ page }) => {
  await page.goto("/education");
  await expect(page.locator("details.entry")).toHaveCount(2);
  await page.goto("/stack");
  await expect(page.getByRole("heading", { name: "How I use them" })).toBeVisible();
  await expect(page.locator(".facts")).toContainText("Frontend");
  await page.goto("/contact");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Have a role in mind?");
  await expect(page.locator("main").getByRole("link", { name: "Book a call" })).toBeVisible();
});

test("unknown work 404s", async ({ page }) => {
  expect((await page.goto("/work/nope"))!.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nothing here.");
});

test("resume pdf downloads", async ({ request }) => {
  const res = await request.get("/resume.pdf");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  expect(res.headers()["content-disposition"]).toContain("attachment");
  expect((await res.body()).subarray(0, 4).toString()).toBe("%PDF");
});
