import { expect, test } from "@playwright/test";

// Must match playwright.config.ts webServer.env.
const ENTRY = "/studio-e2e-gate-01";

test("visitors cannot tell there is an admin panel", async ({ page, request }) => {
  const notFound = await page.goto("/this-page-does-not-exist");
  const notFoundText = await page.locator("main").innerText();
  for (const path of ["/keystatic", "/keystatic/branch/master/singleton/site", "/studio-e2e-gate-02"]) {
    const res = await page.goto(path);
    expect(res!.status(), path).toBe(404);
    expect(await page.locator("main").innerText(), path).toBe(notFoundText);
    await expect(page).toHaveTitle(await notFound!.request().frame().title());
  }
  expect((await request.get("/api/keystatic/github/login")).status()).toBe(404);
  for (const path of ["/", "/sitemap.xml", "/robots.txt"]) {
    const body = await (await request.get(path)).text();
    expect(body.toLowerCase(), path).not.toContain("keystatic");
    expect(body, path).not.toContain(ENTRY);
  }
});

test("the private address opens the panel and keeps it out of search engines", async ({ page, context }) => {
  const res = await page.goto(ENTRY);
  await expect(page).toHaveURL(/\/keystatic$/);
  expect(res!.status()).toBe(200);
  expect(res!.headers()["x-robots-tag"]).toContain("noindex");
  const cookie = (await context.cookies()).find((c) => c.name === "__studio");
  expect(cookie?.httpOnly).toBe(true);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  // Deep links inside the panel work once the cookie is set.
  const deep = await page.goto("/keystatic/branch/master/singleton/site");
  expect(deep!.status()).toBe(200);
});

test("a wrong cookie does not open the panel", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "__studio", value: "guess", url: baseURL! }]);
  expect((await page.goto("/keystatic"))!.status()).toBe(404);
});
