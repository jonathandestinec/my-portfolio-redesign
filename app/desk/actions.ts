"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/proposals/owner";
import { createDiscovery, deleteDiscovery, getDiscovery, linkDiscovery, parseDiscovery, saveDiscovery, seedFromDiscovery } from "@/lib/proposals/discovery";
import type { BusinessSettings } from "@/lib/proposals/invoice-types";
import { createBalanceInvoice, createDepositInvoice, markAccepted, markInvoicePaid, saveBusiness, voidInvoice } from "@/lib/proposals/invoices";
import { paidEmail } from "@/lib/proposals/payments";
import {
  createProposal,
  deleteDraft,
  duplicateProposal,
  extendProposal,
  getProposal,
  getSignatures,
  getVersion,
  saveContent,
  sendProposal,
  setPasscodeHash,
  withdrawProposal,
} from "@/lib/proposals/repo";
import { clientIp, hashPasscode } from "@/lib/proposals/security";
import { chosenOption, decodeSignature, storeSignatureImage } from "@/lib/proposals/service";
import { readiness } from "@/lib/proposals/snapshot";
import { parseContent } from "@/lib/proposals/validate";

export type ActionResult = { ok: true } | { ok: false; error: string };

const fail = (e: unknown): ActionResult => ({ ok: false, error: e instanceof Error ? e.message : "Something went wrong." });

export async function createAction() {
  await requireOwner();
  const id = await createProposal();
  redirect(`/desk/${id}`);
}

export async function saveAction(id: string, content: unknown): Promise<ActionResult> {
  await requireOwner();
  try {
    await saveContent(id, parseContent(content));
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function sendAction(id: string, signature: string): Promise<ActionResult> {
  await requireOwner();
  try {
    const row = await getProposal(id);
    if (!row) throw new Error("Not found");
    const problems = readiness(row.content);
    if (problems.length) throw new Error(problems.join(" "));
    const png = decodeSignature(signature);
    if (!png) throw new Error("Add your signature first.");
    const h = await headers();
    const signatureKey = await storeSignatureImage(id, row.version + 1, "provider", png);
    await sendProposal(id, { signatureKey, ip: clientIp(h), userAgent: h.get("user-agent")?.slice(0, 400) ?? null });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function withdrawAction(id: string): Promise<void> {
  await requireOwner();
  await withdrawProposal(id);
  refresh();
}

export async function extendAction(id: string, days: number): Promise<void> {
  await requireOwner();
  await extendProposal(id, Math.min(Math.max(Math.round(days), 1), 90));
  refresh();
}

export async function passcodeAction(id: string, passcode: string | null): Promise<ActionResult> {
  await requireOwner();
  const p = passcode?.trim() ?? "";
  if (passcode !== null && p.length < 4) return { ok: false, error: "Use at least 4 characters." };
  await setPasscodeHash(id, passcode === null ? null : await hashPasscode(p));
  refresh();
  return { ok: true };
}

export async function duplicateAction(id: string) {
  await requireOwner();
  const copy = await duplicateProposal(id);
  redirect(`/desk/${copy}`);
}

export async function deleteAction(id: string) {
  await requireOwner();
  await deleteDraft(id);
  redirect("/desk");
}

// ---------- After signing: acceptance and invoices ----------

export async function acceptWorkAction(id: string): Promise<ActionResult> {
  await requireOwner();
  try {
    const row = await getProposal(id);
    if (!row || row.status !== "signed") throw new Error("Only a signed proposal can be accepted.");
    const sig = (await getSignatures(id, row.version)).find((s) => s.role === "client");
    const v = await getVersion(id, row.version);
    if (!sig || !v) throw new Error("Signature not found.");
    await markAccepted(id);
    await createBalanceInvoice(row, v.snapshot, chosenOption(v.snapshot, sig.optionId)!, sig.name);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Issues the deposit invoice by hand (e.g. if business details were added after signing). */
export async function issueDepositAction(id: string): Promise<ActionResult> {
  await requireOwner();
  try {
    const row = await getProposal(id);
    if (!row || row.status !== "signed") throw new Error("Only a signed proposal has invoices.");
    const sig = (await getSignatures(id, row.version)).find((s) => s.role === "client");
    const v = await getVersion(id, row.version);
    if (!sig || !v) throw new Error("Signature not found.");
    await createDepositInvoice(row, v.snapshot, chosenOption(v.snapshot, sig.optionId)!, sig.name);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function markPaidAction(invoiceId: string): Promise<void> {
  await requireOwner();
  const changed = await markInvoicePaid(invoiceId, "transfer");
  if (changed) await paidEmail(changed).catch(() => undefined);
  refresh();
}

export async function voidInvoiceAction(invoiceId: string): Promise<void> {
  await requireOwner();
  await voidInvoice(invoiceId);
  refresh();
}

// ---------- Settings ----------

export async function saveBusinessAction(input: BusinessSettings): Promise<ActionResult> {
  await requireOwner();
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  await saveBusiness({
    businessName: s(input.businessName, 120),
    phone: s(input.phone, 40),
    email: s(input.email, 200),
    address: s(input.address, 300),
    bankName: s(input.bankName, 80),
    accountName: s(input.accountName, 120),
    accountNumber: s(input.accountNumber, 30),
  });
  refresh();
  return { ok: true };
}

// ---------- Discovery ----------

export async function createDiscoveryAction() {
  await requireOwner();
  const id = await createDiscovery();
  redirect(`/desk/discovery/${id}`);
}

export async function saveDiscoveryAction(id: string, business: string, notes: unknown): Promise<ActionResult> {
  await requireOwner();
  try {
    await saveDiscovery(id, business.trim().slice(0, 120), parseDiscovery(notes));
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteDiscoveryAction(id: string) {
  await requireOwner();
  await deleteDiscovery(id);
  redirect("/desk/discovery");
}

/** Starts a proposal pre-filled from discovery notes, and links the two. */
export async function proposalFromDiscoveryAction(id: string) {
  await requireOwner();
  const d = await getDiscovery(id);
  if (!d) throw new Error("Not found");
  if (d.proposalId && (await getProposal(d.proposalId))) redirect(`/desk/${d.proposalId}`);
  const pid = await createProposal(seedFromDiscovery(d));
  await linkDiscovery(id, pid);
  redirect(`/desk/${pid}`);
}
