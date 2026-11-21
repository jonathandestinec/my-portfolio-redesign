import { confirmPaystack } from "@/lib/proposals/payments";
import { validWebhookSignature } from "@/lib/proposals/paystack";

/**
 * Paystack webhook (set its URL in the Paystack dashboard to
 * https://destinejc.vercel.app/api/paystack/webhook). Signed with the secret
 * key; the payment is verified with Paystack again before an invoice is marked paid.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validWebhookSignature(raw, req.headers.get("x-paystack-signature"))) return new Response("Invalid signature", { status: 401 });
  const event = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    await confirmPaystack(event.data.reference).catch((e) => console.error("paystack webhook verify failed", e));
  }
  return new Response("ok");
}
