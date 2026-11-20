"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/proposals/owner";
import {
  createProposal,
  deleteDraft,
  duplicateProposal,
  extendProposal,
  getProposal,
  saveContent,
  sendProposal,
  setPasscodeHash,
  withdrawProposal,
} from "@/lib/proposals/repo";
import { clientIp, hashPasscode } from "@/lib/proposals/security";
import { decodeSignature, storeSignatureImage } from "@/lib/proposals/service";
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
