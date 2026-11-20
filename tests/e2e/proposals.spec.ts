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
  await page.getByLabel("In your words").fill("We lose orders in WhatsApp and nobody knows who paid.");
  await page.getByRole("button", { name: "Add objective" }).click();
  await page.getByPlaceholder("A measurable result").fill("Missed orders under 2 a week");
  await page.getByRole("button", { name: "Payments", exact: true }).click();
  await page.getByRole("button", { name: /^\+ AgroHub/ }).click();
  // Three options by default: price two of them, give each a deliverable, drop the third.
  const prices = page.getByRole("textbox", { name: /^Price/ });
  await prices.nth(0).fill("250,000");
  await prices.nth(1).fill("600,000");
  const addDeliverable = page.getByRole("button", { name: "Add deliverable" });
  await addDeliverable.nth(0).click();
  await page.getByPlaceholder("Deliverable").nth(0).fill("Order page");
  await addDeliverable.nth(1).click();
  await page.getByPlaceholder("Deliverable").nth(1).fill("Ordering portal");
  await page.getByRole("button", { name: "Remove option" }).nth(2).click();
  await page.getByRole("button", { name: "Add exclusion" }).click();
  await page.getByPlaceholder("e.g. Mobile apps for iOS or Android").fill("Mobile apps");
  await page.getByRole("button", { name: "Add criterion" }).click();
  await page.getByPlaceholder("e.g. A shop owner can place and pay for an order on a phone").fill("Orders can be placed on a phone");
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

  test("pick an option on a phone, draw a signature, pay the deposit invoice, accept, balance", async ({ page, browser, playwright }) => {
    // Bank details for the invoices.
    await page.goto(ENTRY);
    await page.goto("/desk/settings");
    await page.getByLabel("Business name").fill("Destine Jonathan");
    await page.getByLabel("Phone").fill("+234 800 000 0000");
    await page.getByLabel("Bank").fill("Test Bank");
    await page.getByLabel("Account name").fill("Destine Jonathan");
    await page.getByLabel("Account number").fill("0123456789");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Saved. New invoices use these details.")).toBeVisible();

    const { admin, path } = await createAndSend(page, "E2E Options Co");
    expect(path).toMatch(/^\/p\/e2e-options-co-[0-9A-Za-z]{22}$/);

    const phone = await browser.newContext({ ...playwright.devices["iPhone 13"], baseURL: page.url().split("/desk")[0] });
    const client = await phone.newPage();
    const res = await client.goto(path);
    expect(res!.headers()["x-robots-tag"]).toContain("noindex");
    await expect(client.getByRole("heading", { name: /Proposal for E2E Options Co/ })).toBeVisible();
    await expect(client.getByRole("heading", { name: "In your words" })).toBeVisible();
    await expect(client.getByText("We lose orders in WhatsApp")).toBeVisible();
    await expect(client.getByRole("heading", { name: "Not included" })).toBeVisible();
    await expect(client.getByRole("heading", { name: "How to say yes" })).toBeVisible();

    // The recommended option (Standard) is selected; switch to Essential.
    await expect(client.getByText(/You’ve selected Standard/)).toBeVisible();
    await client.locator(".pp-option", { hasText: "Essential" }).click();
    await expect(client.getByRole("radio", { name: /Essential/ })).toBeChecked();
    await expect(client.getByText(/You’ve selected Essential \(₦250,000\.00\)/)).toBeVisible();
    await expect(client.locator(".pp-contract").first()).toContainText("the Essential option");

    await client.getByRole("tab", { name: "Draw" }).click();
    const pad = client.getByLabel("Draw your signature");
    const box = (await pad.boundingBox())!;
    await client.mouse.move(box.x + 20, box.y + box.height / 2);
    await client.mouse.down();
    for (let i = 1; i <= 12; i++) await client.mouse.move(box.x + 20 + i * 18, box.y + box.height / 2 + (i % 2 ? -14 : 14));
    await client.mouse.up();
    await client.getByLabel("I have read and agree").check();
    await expect(client.getByText(/You’re signing for Essential/)).toBeVisible();
    await client.getByRole("button", { name: "Sign the agreement" }).click();
    await expect(client.getByText(/Signed by Ada Test/)).toBeVisible({ timeout: 30_000 });
    await expect(client.getByRole("heading", { name: "What you chose" })).toBeVisible();
    await expect(client.getByText("Next: pay the deposit of ₦125,000.00")).toBeVisible();

    const pdf = await client.request.get(path.replace("/p/", "/api/p/") + "/pdf");
    expect(pdf.headers()["content-type"]).toBe("application/pdf");

    // The invoice: all nine lines, bank details, no Paystack button without a key.
    await client.getByRole("link", { name: "View invoice and pay" }).click();
    await expect(client.getByRole("heading", { name: /Invoice \d{4}-\d{3}/ })).toBeVisible();
    for (const line of ["Destine Jonathan", "+234 800 000 0000", "Issued", "Due", "E2E Options Co", "Essential: 50% deposit", "Deposit due now", "₦125,000.00", "0123456789", "1.5% per month"])
      await expect(client.getByText(line).first()).toBeVisible();
    const invoicePdf = await client.request.get(new URL(client.url()).pathname.replace("/i/", "/api/i/") + "/pdf");
    expect(invoicePdf.headers()["content-type"]).toBe("application/pdf");

    // The owner marks the transfer paid, accepts the work: the balance invoice follows.
    await page.goto(admin);
    await expect(page.getByRole("heading", { name: "Signed", exact: true })).toBeVisible();
    await expect(page.getByText("Chose Essential")).toBeVisible();
    page.on("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Mark paid (transfer)" }).click();
    await expect(page.getByText(/Paid .* by transfer/)).toBeVisible();
    await page.getByRole("button", { name: "Mark work accepted" }).click();
    await expect(page.getByText(/Balance · ₦125,000\.00/)).toBeVisible();
    await client.goto(path);
    await expect(client.getByText("Deposit received.")).toBeVisible();
    await expect(client.getByText("Next: pay the balance of ₦125,000.00")).toBeVisible();

    const again = await client.request.post(path.replace("/p/", "/api/p/") + "/sign", { data: {} });
    expect(again.status()).toBe(409);
    await phone.close();
  });

  test("discovery notes start a proposal in the client’s words", async ({ page }) => {
    await page.goto(ENTRY);
    await page.goto("/desk/discovery");
    await page.getByRole("button", { name: "New conversation" }).click();
    await page.waitForURL(/\/desk\/discovery\/[0-9a-f-]{36}$/);
    await page.getByLabel("Business name").fill("E2E Bakery");
    await page.getByLabel("Who you spoke to").fill("Tunde");
    await page.getByLabel("What part of that goes wrong most often?").fill("Customers say they paid and we can’t find it.");
    await page.getByLabel("The value number").fill("About 5 disputes a week");
    await page.getByLabel("Decision-maker").fill("Mrs Bello");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Saved.")).toBeVisible();
    await page.getByRole("button", { name: "Start a proposal" }).click();
    await page.waitForURL(/\/desk\/[0-9a-f-]{36}$/);
    await expect(page.getByLabel("Client name")).toHaveValue("E2E Bakery");
    await expect(page.getByLabel("Contact name")).toHaveValue("Mrs Bello");
    await expect(page.getByLabel("In your words")).toHaveValue("Customers say they paid and we can’t find it.");
    await expect(page.getByPlaceholder("A measurable result")).toHaveValue("Fix this: About 5 disputes a week");
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
