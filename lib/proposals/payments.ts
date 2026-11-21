import "server-only";
import { siteUrl } from "@/lib/site-url";
import { notifyOwner } from "./email";
import { getInvoice, invoiceKey, markInvoicePaid, type InvoiceRow } from "./invoices";
import { formatMoney } from "./money";
import { paymentMatches, verifyPayment } from "./paystack";

export const invoiceUrl = (inv: Pick<InvoiceRow, "number" | "token">) => `${siteUrl()}/i/${invoiceKey(inv)}`;

/** Emails the owner once, when an invoice flips to paid. */
export async function paidEmail(inv: InvoiceRow) {
  await notifyOwner({
    subject: `Paid: invoice ${inv.number} (${formatMoney(inv.amountMinor, inv.currency)})`,
    text: [
      `${inv.details.client.name} paid invoice ${inv.number}${inv.paidVia === "paystack" ? " through Paystack" : ""}.`,
      "",
      `For: ${inv.details.forTitle}`,
      `Amount: ${formatMoney(inv.amountMinor, inv.currency)}`,
      inv.paystackReference ? `Paystack reference: ${inv.paystackReference}` : "",
      "",
      invoiceUrl(inv),
    ]
      .filter((l) => l !== "")
      .join("\n"),
  });
}

/**
 * Confirms a Paystack payment with Paystack itself, then marks the invoice paid
 * if the amount and currency match. Safe to call more than once (callback and webhook both do).
 */
export async function confirmPaystack(reference: string, expectInvoiceId?: string): Promise<"paid" | "already" | "unverified"> {
  const p = await verifyPayment(reference);
  const id = p.invoiceId ?? expectInvoiceId;
  if (!id || (expectInvoiceId && id !== expectInvoiceId)) return "unverified";
  const inv = await getInvoice(id);
  if (!inv) return "unverified";
  if (inv.status === "paid") return "already";
  if (!paymentMatches(p, inv)) return "unverified";
  const changed = await markInvoicePaid(inv.id, "paystack", p.reference);
  if (changed) await paidEmail(changed).catch(() => undefined);
  return changed ? "paid" : "already";
}
