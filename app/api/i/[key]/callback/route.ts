import { getInvoiceByToken, invoiceKey } from "@/lib/proposals/invoices";
import { confirmPaystack } from "@/lib/proposals/payments";
import { tokenFromKey } from "@/lib/proposals/tokens";

/** Paystack sends the payer back here. The payment is verified with Paystack before anything is marked paid. */
export async function GET(req: Request, ctx: RouteContext<"/api/i/[key]/callback">) {
  const { key } = await ctx.params;
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref");
  const token = tokenFromKey(key);
  const inv = token ? await getInvoiceByToken(token) : null;
  if (!inv || invoiceKey(inv) !== key) return new Response("Not found", { status: 404 });
  if (!reference) return Response.redirect(new URL(`/i/${key}`, req.url), 303);
  const result = await confirmPaystack(reference, inv.id).catch(() => "unverified" as const);
  return Response.redirect(new URL(`/i/${key}?${result === "unverified" ? "error=unverified" : "paid=1"}`, req.url), 303);
}
