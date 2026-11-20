import { randomBytes } from "node:crypto";
import { getInvoiceByToken, invoiceKey, invoiceState, setPaystackReference } from "@/lib/proposals/invoices";
import { initializePayment, paystackConfigured } from "@/lib/proposals/paystack";
import { clientIp, rateLimit } from "@/lib/proposals/security";
import { tokenFromKey } from "@/lib/proposals/tokens";
import { siteUrl } from "@/lib/site-url";

/** Starts a Paystack checkout for the exact invoice amount, then sends the browser there. */
export async function POST(req: Request, ctx: RouteContext<"/api/i/[key]/pay">) {
  const { key } = await ctx.params;
  const back = (q: string) => Response.redirect(new URL(`/i/${key}?${q}`, req.url), 303);
  if (!rateLimit(`pay:${clientIp(req.headers) ?? "?"}`, 20, 10 * 60 * 1000)) return back("error=start");
  const token = tokenFromKey(key);
  const inv = token ? await getInvoiceByToken(token) : null;
  if (!inv || invoiceKey(inv) !== key) return new Response("Not found", { status: 404 });
  if (invoiceState(inv) === "paid" || inv.status === "void" || !paystackConfigured()) return back("");

  const reference = `${inv.number}-${randomBytes(5).toString("hex")}`;
  try {
    await setPaystackReference(inv.id, reference);
    const url = await initializePayment({
      email: inv.details.client.contactEmail || inv.details.from.email,
      amountMinor: inv.amountMinor,
      currency: inv.currency,
      reference,
      callbackUrl: `${siteUrl()}/api/i/${key}/callback`,
      invoiceId: inv.id,
      invoiceNumber: inv.number,
    });
    return Response.redirect(url, 303);
  } catch (e) {
    console.error("paystack initialize failed", e);
    return back("error=start");
  }
}
