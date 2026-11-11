import { expect, test } from "@playwright/test";
import { waitForHydration } from "./helpers";

test("home sections render in order", async ({ page }) => {
  await page.goto("/");
  const ids = await page.$$eval("main section[id]", (s) => s.map((e) => e.id));
  expect(ids).toEqual(["works", "experience", "education", "stack", "writing"]);
});

test("hero type matches the reference: weight 400 display, no bold", async ({ page }) => {
  await page.goto("/");
  const p = page.locator(".lead p").first();
  await expect(p).toHaveCSS("font-weight", "400");
  const size = await p.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  expect([26, 32]).toContain(size);
  await expect(page.locator(".lead h1 .hl")).toHaveCSS("font-weight", "500");
});

test("the hand note hangs off the AgroHub link and points at it", async ({ page }) => {
  await page.goto("/");
  const link = page.locator("a.note__link");
  await expect(link).toHaveAttribute("href", "/work/agrohub");
  await expect(link.locator(".note__text")).toHaveText("check this out :)");
  const l = (await link.boundingBox())!;
  const n = (await link.locator(".note").boundingBox())!;
  // Below the link, starting under it.
  expect(n.y).toBeGreaterThan(l.y + l.height / 2);
  expect(n.x).toBeLessThan(l.x + l.width);
});

test("hero actions are laid out side by side, all visible at once", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("header.intro");
  for (const name of ["Book a call", "Email me", /Résumé/]) {
    await expect(hero.getByRole("link", { name })).toBeVisible();
  }
  const a = (await hero.getByRole("link", { name: "Book a call" }).boundingBox())!;
  const b = (await hero.getByRole("link", { name: "Email me" }).boundingBox())!;
  expect(Math.abs(a.y + a.height / 2 - (b.y + b.height / 2))).toBeLessThanOrEqual(2);
});

test("experience cards have logos and open in place", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  const first = page.locator("#experience details").first();
  await expect(first).toContainText("Welup Digital");
  await expect(first.locator(".logo-mark img")).toBeVisible();
  await expect(first.locator(".entry__more")).toBeHidden();
  await first.locator("summary").click();
  await expect(first.locator(".entry__more")).toBeVisible();
  await expect(first.getByRole("link", { name: /Full details/ })).toHaveAttribute(
    "href",
    "/experience#welup-digital",
  );
});

test("works link goes to the works page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /All works/ }).click();
  await expect(page).toHaveURL(/\/works$/);
});
