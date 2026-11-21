import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paystack checkout for invoices. Needs PAYSTACK_SECRET_KEY (sk_live_… or
 * sk_test_…). A payment only counts once the server has verified it with
 * Paystack: the browser redirect alone is never trusted.
 */
const API = "https://api.paystack.co";

export const paystackConfigured = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || !body.status || !body.data) throw new Error(body.message || `Paystack error ${res.status}`);
  return body.data;
}

export async function initializePayment(input: {
  email: string;
  amountMinor: number;
  currency: "NGN" | "USD";
  reference: string;
  callbackUrl: string;
  invoiceId: string;
  invoiceNumber: string;
}): Promise<string> {
  const data = await call<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinor,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: { invoice_id: input.invoiceId, invoice_number: input.invoiceNumber },
    }),
  });
  return data.authorization_url;
}

export type VerifiedPayment = { status: string; amount: number; currency: string; reference: string; invoiceId: string | null };

export async function verifyPayment(reference: string): Promise<VerifiedPayment> {
  const d = await call<{ status: string; amount: number; currency: string; reference: string; metadata?: { invoice_id?: string } | string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  const meta = typeof d.metadata === "object" && d.metadata ? d.metadata : {};
  return { status: d.status, amount: d.amount, currency: d.currency, reference: d.reference, invoiceId: meta.invoice_id ?? null };
}

/** Paystack signs webhooks with HMAC-SHA512 of the raw body, keyed with the secret key. */
export function validWebhookSignature(rawBody: string, signature: string | null, secret = process.env.PAYSTACK_SECRET_KEY ?? ""): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** A payment counts only if Paystack says it succeeded for the exact amount and currency. */
export const paymentMatches = (p: Pick<VerifiedPayment, "status" | "amount" | "currency">, inv: { amountMinor: number; currency: string }) =>
  p.status === "success" && p.amount === inv.amountMinor && p.currency === inv.currency;
