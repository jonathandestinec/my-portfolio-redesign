import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Must match playwright.config.ts webServer.env.
const ENTRY = "/studio-e2e-gate-01";
const hasDb = fs.existsSync(".env.local") && /^DATABASE_URL=/m.test(fs.readFileSync(".env.local", "utf8"));

test("visitors can’t reach the proposals admin, and unknown links reveal nothing", async ({ page, request }) => {
  for (const path of ["/desk", "/desk/00000000-0000-0000-0000-000000000000", "/api/desk/00000000-0000-0000-0000-000000000000/pdf"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  const res = await page.goto("/p/acme-AAAAAAAAAAAAAAAAAAAAAA");
  expect(res!.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.getByRole("heading", { name: "This proposal is no longer available." })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect((await request.get("/api/p/acme-AAAAAAAAAAAAAAAAAAAAAA/pdf")).status()).toBe(404);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/p/");
  expect(sitemap).not.toContain("/desk");
});

async function createAndSend(page: Page, client: string) {
  await page.goto(ENTRY);
  await page.goto("/desk");
  await page.getByRole("button", { name: "New proposal" }).click();
  await page.waitForURL(/\/desk\/[0-9a-f-]{36}$/);
  await page.getByLabel("Client name").fill(client);
  await page.getByLabel("Contact name").fill("Ada Test");
  await page.getByLabel("Contact email").fill("ada@example.test");
  await page.getByLabel("What they need").fill("An ordering portal with online payments.");
  await page.getByRole("button", { name: "Payments", exact: true }).click();
  await page.getByRole("button", { name: /^\+ AgroHub/ }).click();
  await page.getByRole("button", { name: "Add milestone" }).click();
  await page.getByPlaceholder("Milestone").fill("Build");
  await page.getByRole("textbox", { name: /^Amount/ }).fill("250,000");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await page.getByRole("button", { name: "Sign and send" }).click();
  const linkField = page.getByLabel("Client link");
  await expect(linkField).toBeVisible({ timeout: 30_000 });
  const url = new URL(await linkField.inputValue());
  return { admin: page.url(), path: url.pathname };
}

test.describe("proposal lifecycle", () => {
  test.skip(!hasDb, "needs DATABASE_URL in .env.local (a non-production Neon branch)");
  test.describe.configure({ mode: "serial" });
  test.skip(({ isMobile }) => isMobile, "driven from the desktop project; the client side uses a phone context");

  test("send, open on a phone, draw a signature, download the signed PDF", async ({ page, browser, playwright }) => {
    const { admin, path } = await createAndSend(page, "E2E Drawn Co");
    expect(path).toMatch(/^\/p\/e2e-drawn-co-[0-9A-Za-z]{22}$/);

    const phone = await browser.newContext({ ...playwright.devices["iPhone 13"], baseURL: page.url().split("/desk")[0] });
    const client = await phone.newPage();
    const res = await client.goto(path);
    expect(res!.headers()["x-robots-tag"]).toContain("noindex");
    await expect(client.getByRole("heading", { name: /Proposal for E2E Drawn Co/ })).toBeVisible();
    await expect(client.getByText("₦250,000.00").first()).toBeVisible();
    await expect(client.getByRole("heading", { name: "AgroHub" })).toBeVisible();

    await client.getByRole("tab", { name: "Draw" }).click();
    const pad = client.getByLabel("Draw your signature");
    const box = (await pad.boundingBox())!;
    await client.mouse.move(box.x + 20, box.y + box.height / 2);
    await client.mouse.down();
    for (let i = 1; i <= 12; i++) await client.mouse.move(box.x + 20 + i * 18, box.y + box.height / 2 + (i % 2 ? -14 : 14));
    await client.mouse.up();
    await client.getByLabel("I have read and agree").check();
    await client.getByRole("button", { name: "Sign the agreement" }).click();
    await expect(client.getByText(/Signed by Ada Test/)).toBeVisible({ timeout: 30_000 });
    await expect(client.getByRole("button", { name: "Sign the agreement" })).toHaveCount(0);

    const pdf = await client.request.get(path.replace("/p/", "/api/p/") + "/pdf");
    expect(pdf.headers()["content-type"]).toBe("application/pdf");
    expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");

    // Signed proposals can't be edited or signed again.
    await page.goto(admin);
    await expect(page.getByRole("heading", { name: "Signed", exact: true })).toBeVisible();
    await expect(page.getByLabel("Client name")).toBeDisabled();
    const again = await client.request.post(path.replace("/p/", "/api/p/") + "/sign", { data: {} });
    expect(again.status()).toBe(409);
    await phone.close();
  });

  test("a passcode guards the link; withdrawing it hides everything", async ({ page, browser }) => {
    const { path } = await createAndSend(page, "E2E Locked Co");
    await page.getByRole("button", { name: "Add a passcode" }).click();
    await page.getByLabel("Passcode").fill("lagos-2026");
    await page.getByRole("button", { name: "Set", exact: true }).click();
    await expect(page.getByRole("button", { name: "Change passcode" })).toBeVisible();

    const other = await browser.newContext({ baseURL: page.url().split("/desk")[0] });
    const client = await other.newPage();
    await client.goto(path);
    await expect(client.getByRole("heading", { name: "This proposal is protected." })).toBeVisible();
    await expect(client.getByText("E2E Locked Co")).toHaveCount(0);
    expect((await client.request.get(path.replace("/p/", "/api/p/") + "/pdf")).status()).toBe(404);
    await client.getByLabel("Passcode").fill("wrong");
    await client.getByRole("button", { name: "Open proposal" }).click();
    await expect(client.getByText("That passcode isn’t right.")).toBeVisible();
    await client.getByLabel("Passcode").fill("lagos-2026");
    await client.getByRole("button", { name: "Open proposal" }).click();
    await expect(client.getByRole("heading", { name: /Proposal for E2E Locked Co/ })).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Withdraw" }).click();
    await expect(page.getByRole("heading", { name: "Withdrawn", exact: true })).toBeVisible();
    await client.reload();
    await expect(client.getByRole("heading", { name: "This proposal is no longer available." })).toBeVisible();
    await expect(client.getByText("E2E Locked Co")).toHaveCount(0);
    await other.close();
  });
});
