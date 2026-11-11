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
  await page.addInitScript(() => {
    localStorage.setItem("theme", "dark");
    const w = window as unknown as {
      __firstTheme?: { value: string | null; bodyExisted: boolean };
    };
    // Record the very first data-theme ever set, and whether <body> existed then.
    const observer = new MutationObserver(() => {
      const value = document.documentElement.getAttribute("data-theme");
      if (value && !w.__firstTheme) {
        w.__firstTheme = { value, bodyExisted: !!document.body };
        observer.disconnect();
      }
    });
    observer.observe(document, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-theme"],
    });
  });
  await page.goto("/");
  const first = await page.evaluate(
    () =>
      (window as unknown as { __firstTheme?: { value: string; bodyExisted: boolean } })
        .__firstTheme,
  );
  expect(first).toEqual({ value: "dark", bodyExisted: false });
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

test("body uses the Funnel Sans font", async ({ page }) => {
  await page.goto("/");
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(family).toMatch(/Funnel[ _]Sans/);
});
