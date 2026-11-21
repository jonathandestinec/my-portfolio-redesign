import { fileResponse, notFound } from "@/lib/proposals/http";
import { getInvoiceByToken, invoiceKey, invoiceState } from "@/lib/proposals/invoices";
import { buildInvoicePdf } from "@/lib/proposals/pdf";
import { tokenFromKey } from "@/lib/proposals/tokens";

export async function GET(_req: Request, ctx: RouteContext<"/api/i/[key]/pdf">) {
  const { key } = await ctx.params;
  const token = tokenFromKey(key);
  const inv = token ? await getInvoiceByToken(token) : null;
  if (!inv || invoiceKey(inv) !== key || inv.status === "void") return notFound();
  const body = await buildInvoicePdf({ ...inv, state: invoiceState(inv) });
  return fileResponse({ body, contentType: "application/pdf" }, `attachment; filename="Invoice-${inv.number}.pdf"`);
}
