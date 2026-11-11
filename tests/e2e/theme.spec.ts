import { expect, test } from "@playwright/test";

test("toggle sets dark theme and survives reload", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await page.evaluate(() => localStorage.removeItem("theme"));
  await page.emulateMedia({ colorScheme: "light" });
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
  const toggle = page.getByRole("button", { name: "Toggle dark mode" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});

test("saved dark theme does not flash light on first paint", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto("/");
  const png = await page.screenshot({ clip: { x: 5, y: 5, width: 1, height: 1 } });
  const r = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, 1, 1).data[0];
  }, png.toString("base64"));
  expect(r).toBeLessThan(60);
});
