import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { site } from "@/content/site";
import { addDays, workingDaysBetween } from "./dates";
import { db, schema } from "./db";
import { emptyBusiness, type BusinessSettings, type InvoiceDetails } from "./invoice-types";
import { bpsLabel } from "./money";
import type { InvoiceRow, ProposalRow } from "./schema";
import { newToken } from "./tokens";
import type { PaymentTerms, Snapshot, SnapshotOption } from "./types";

const { invoices, settings, proposals } = schema;

export type { InvoiceRow };

// ---------- Settings (business details for invoices) ----------

export async function getBusiness(): Promise<BusinessSettings> {
  const [row] = await db().select().from(settings).where(eq(settings.key, "business"));
  const saved = (row?.value ?? {}) as Partial<BusinessSettings>;
  const base = { ...emptyBusiness(), businessName: "Destine Jonathan", email: site.email };
  return { ...base, ...Object.fromEntries(Object.entries(saved).filter(([, v]) => typeof v === "string" && v.trim())) };
}

export async function saveBusiness(value: BusinessSettings): Promise<void> {
  await db()
    .insert(settings)
    .values({ key: "business", value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

export const hasBankDetails = (b: BusinessSettings) => Boolean(b.bankName && b.accountName && b.accountNumber);

// ---------- Numbering ----------

export const formatInvoiceNumber = (year: number, n: number) => `${year}-${String(n).padStart(3, "0")}`;

/** Next number for the year, allocated atomically (concurrent calls never share one). */
export async function nextInvoiceNumber(year = new Date().getUTCFullYear()): Promise<string> {
  const res = await db().execute(sql`
    INSERT INTO invoice_counters (year, last) VALUES (${year}, 1)
    ON CONFLICT (year) DO UPDATE SET last = invoice_counters.last + 1
    RETURNING last
  `);
  return formatInvoiceNumber(year, Number((res.rows[0] as { last: number }).last));
}

// ---------- Status ----------

export type InvoiceState = "paid" | "void" | "unpaid" | "overdue";

export function invoiceState(inv: Pick<InvoiceRow, "status" | "dueAt">, now = new Date()): InvoiceState {
  if (inv.status !== "unpaid") return inv.status;
  return inv.dueAt < now ? "overdue" : "unpaid";
}

/** Working days past the due date (0 when not overdue). */
export const workingDaysLate = (inv: Pick<InvoiceRow, "status" | "dueAt">, now = new Date()) =>
  invoiceState(inv, now) === "overdue" ? workingDaysBetween(inv.dueAt, now) : 0;

export function termsLine(terms: PaymentTerms): string {
  return `Late payment: ${bpsLabel(terms.lateFeeBps)} per month on overdue amounts. Work pauses when a payment is ${terms.stopWorkDays} working days late.`;
}

// ---------- Creating ----------

async function insertInvoice(input: {
  proposalId: string;
  kind: "deposit" | "balance";
  amountMinor: number;
  currency: Snapshot["currency"];
  dueAt: Date;
  details: InvoiceDetails;
}): Promise<InvoiceRow> {
  const [existing] = await db()
    .select()
    .from(invoices)
    .where(and(eq(invoices.proposalId, input.proposalId), eq(invoices.kind, input.kind)));
  if (existing) return existing;
  const number = await nextInvoiceNumber();
  const [row] = await db()
    .insert(invoices)
    .values({ ...input, number, token: newToken() })
    .onConflictDoNothing({ target: [invoices.proposalId, invoices.kind] })
    .returning();
  if (row) return row;
  const [raced] = await db()
    .select()
    .from(invoices)
    .where(and(eq(invoices.proposalId, input.proposalId), eq(invoices.kind, input.kind)));
  return raced;
}

function details(
  from: BusinessSettings,
  snapshot: Snapshot,
  option: SnapshotOption,
  terms: PaymentTerms,
  kind: "deposit" | "balance",
  depositPaidMinor: number,
  signerName: string,
): InvoiceDetails {
  const forTitle = `${option.name || "Project"}: ${kind === "deposit" ? `${terms.depositPercent}% deposit` : "balance on acceptance"}`;
  const delivered = option.deliverables.map((d) => (d.format ? `${d.title} (${d.format})` : d.title));
  const thisInvoiceMinor = kind === "deposit" ? option.depositMinor : option.balanceMinor;
  return {
    from,
    client: { name: snapshot.client.name, contactName: signerName || snapshot.client.contactName, contactEmail: snapshot.client.contactEmail },
    forTitle,
    forLines: kind === "deposit" ? [`To start: ${delivered.join("; ")}`] : [`Delivered: ${delivered.join("; ")}`],
    amounts: {
      totalMinor: option.priceMinor,
      depositPaidMinor,
      thisInvoiceMinor,
      balanceAfterMinor: option.priceMinor - depositPaidMinor - thisInvoiceMinor,
    },
    currency: snapshot.currency,
    terms: termsLine(terms),
  };
}

/** Issued when the client signs. No invoice when there are no terms (older proposals) or no deposit. */
export async function createDepositInvoice(row: ProposalRow, snapshot: Snapshot, option: SnapshotOption, signerName: string) {
  const terms = snapshot.terms;
  if (!terms || option.depositMinor <= 0) return null;
  const now = new Date();
  return insertInvoice({
    proposalId: row.id,
    kind: "deposit",
    amountMinor: option.depositMinor,
    currency: snapshot.currency,
    dueAt: addDays(now, terms.depositDueDays),
    details: details(await getBusiness(), snapshot, option, terms, "deposit", 0, signerName),
  });
}

/** Issued when the owner marks the work accepted. */
export async function createBalanceInvoice(row: ProposalRow, snapshot: Snapshot, option: SnapshotOption, signerName: string) {
  const terms = snapshot.terms;
  if (!terms || option.balanceMinor <= 0) return null;
  const deposit = (await listInvoices(row.id)).find((i) => i.kind === "deposit" && i.status === "paid");
  const now = new Date();
  return insertInvoice({
    proposalId: row.id,
    kind: "balance",
    amountMinor: option.balanceMinor,
    currency: snapshot.currency,
    dueAt: addDays(now, terms.balanceDueDays),
    details: details(await getBusiness(), snapshot, option, terms, "balance", deposit ? deposit.amountMinor : 0, signerName),
  });
}

export async function markAccepted(proposalId: string): Promise<boolean> {
  const res = await db()
    .update(proposals)
    .set({ acceptedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(proposals.id, proposalId), eq(proposals.status, "signed"), sql`${proposals.acceptedAt} IS NULL`))
    .returning({ id: proposals.id });
  return res.length > 0;
}

// ---------- Reading and paying ----------

export async function listInvoices(proposalId: string): Promise<InvoiceRow[]> {
  return db().select().from(invoices).where(eq(invoices.proposalId, proposalId)).orderBy(invoices.issuedAt);
}

export async function getInvoiceByToken(token: string): Promise<InvoiceRow | null> {
  const [row] = await db().select().from(invoices).where(eq(invoices.token, token));
  return row ?? null;
}

export async function getInvoice(id: string): Promise<InvoiceRow | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await db().select().from(invoices).where(eq(invoices.id, id));
  return row ?? null;
}

export async function setPaystackReference(id: string, reference: string): Promise<void> {
  await db().update(invoices).set({ paystackReference: reference }).where(and(eq(invoices.id, id), eq(invoices.status, "unpaid")));
}

/** Marks an unpaid invoice paid. Returns the row only when this call changed it (so emails go out once). */
export async function markInvoicePaid(id: string, via: "paystack" | "transfer", reference?: string): Promise<InvoiceRow | null> {
  const [row] = await db()
    .update(invoices)
    .set({ status: "paid", paidAt: new Date(), paidVia: via, ...(reference ? { paystackReference: reference } : {}) })
    .where(and(eq(invoices.id, id), eq(invoices.status, "unpaid")))
    .returning();
  return row ?? null;
}

export async function voidInvoice(id: string): Promise<void> {
  await db().update(invoices).set({ status: "void" }).where(and(eq(invoices.id, id), eq(invoices.status, "unpaid")));
}

export const invoiceKey = (inv: Pick<InvoiceRow, "number" | "token">) => `${inv.number}-${inv.token}`;
