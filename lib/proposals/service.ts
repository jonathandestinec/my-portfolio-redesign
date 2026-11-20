import "server-only";
import type { SignedBy } from "@/components/proposals/ProposalView";
import { siteUrl } from "@/lib/site-url";
import { notifyOwner } from "./email";
import { formatMoney } from "./money";
import { buildProposalPdf, pdfImage, type PdfSignature } from "./pdf";
import { getByToken, getSignatures, getVersion, setSignaturePdf, signProposal, type ProposalRow, type SignatureRow } from "./repo";
import { sameString, unlockCookieName, unlockValue } from "./security";
import { effectiveStatus, isVisibleToClient } from "./status";
import { readFile, saveFile } from "./storage";
import { proposalKey, tokenFromKey } from "./tokens";
import type { Snapshot, Status } from "./types";

export type ClientAccess =
  | { kind: "missing" }
  | { kind: "unavailable" }
  | { kind: "locked"; row: ProposalRow }
  | { kind: "ok"; row: ProposalRow; status: Status; snapshot: Snapshot; contentSha256: string };

/** Everything the client routes need, with all access rules in one place. */
export async function clientAccess(key: string, cookieValue: (name: string) => string | undefined): Promise<ClientAccess> {
  const token = tokenFromKey(key);
  if (!token) return { kind: "missing" };
  const row = await getByToken(token);
  if (!row || row.version === 0) return { kind: "missing" };
  const status = effectiveStatus(row);
  if (!isVisibleToClient(status)) return { kind: "unavailable" };
  if (row.passcodeHash && status !== "signed") {
    const ok = sameString(cookieValue(unlockCookieName(row.id)), unlockValue(row.id, row.passcodeHash));
    if (!ok) return { kind: "locked", row };
  }
  const v = await getVersion(row.id, row.version);
  if (!v) return { kind: "missing" };
  return { kind: "ok", row, status, snapshot: v.snapshot, contentSha256: v.contentSha256 };
}

export const clientBase = (row: Pick<ProposalRow, "slug" | "token">) => `/p/${proposalKey(row.slug, row.token)}`;
export const clientApi = (row: Pick<ProposalRow, "slug" | "token">) => `/api/p/${proposalKey(row.slug, row.token)}`;
export const clientUrl = (row: Pick<ProposalRow, "slug" | "token">) => `${siteUrl()}${clientBase(row)}`;

export function signedBy(sigs: SignatureRow[], imageUrl: (s: SignatureRow) => string): SignedBy[] {
  return sigs.map((s) => ({ role: s.role, name: s.name, title: s.title, signedAt: s.signedAt, imageUrl: imageUrl(s) }));
}

async function toPdfSignatures(sigs: SignatureRow[]): Promise<PdfSignature[]> {
  return Promise.all(
    sigs.map(async (s) => ({
      role: s.role,
      name: s.name,
      email: s.email,
      title: s.title,
      method: s.method,
      signedAt: s.signedAt,
      ip: s.ip,
      userAgent: s.userAgent,
      contentSha256: s.contentSha256,
      image: pdfImage(await readFile(s.signatureKey)),
    })),
  );
}

export async function renderPdf(row: ProposalRow, snapshot: Snapshot, contentSha256: string): Promise<Buffer> {
  const sigs = await getSignatures(row.id, snapshot.version);
  const logo = snapshot.client.logoKey ? pdfImage(await readFile(snapshot.client.logoKey)) : null;
  return buildProposalPdf({ snapshot, logo, signatures: await toPdfSignatures(sigs), contentSha256 });
}

export const pdfFilename = (snapshot: Snapshot, signed: boolean) =>
  `${snapshot.client.name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "Client"}-proposal${signed ? "-signed" : ""}.pdf`;

/** PNG data URL from the signature pad → bytes, refusing anything else. */
export function decodeSignature(dataUrl: unknown): Buffer | null {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,")) return null;
  const buf = Buffer.from(dataUrl.slice("data:image/png;base64,".length), "base64");
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return png && buf.length > 100 && buf.length < 400_000 ? buf : null;
}

export async function storeSignatureImage(proposalId: string, version: number, role: "client" | "provider", png: Buffer) {
  return saveFile(`proposals/${proposalId}/v${version}-${role}-signature.png`, png, "image/png");
}

/**
 * The client signs: store the image, sign atomically, build and store the signed
 * PDF, then email the owner. Returns false when the proposal can't be signed
 * (stale version, changed content, expired, already signed).
 */
export async function completeClientSignature(input: {
  row: ProposalRow;
  version: number;
  contentSha256: string;
  name: string;
  email: string;
  title: string | null;
  method: "typed" | "drawn";
  png: Buffer;
  ip: string | null;
  userAgent: string | null;
}): Promise<{ ok: true; email: Promise<unknown> } | { ok: false }> {
  const { row } = input;
  const signatureKey = await storeSignatureImage(row.id, input.version, "client", input.png);
  const sigId = await signProposal(row.id, input.version, {
    name: input.name,
    email: input.email,
    title: input.title,
    method: input.method,
    signatureKey,
    ip: input.ip,
    userAgent: input.userAgent,
    contentSha256: input.contentSha256,
  });
  if (!sigId) return { ok: false };

  const v = (await getVersion(row.id, input.version))!;
  const pdf = await renderPdf(row, v.snapshot, v.contentSha256);
  const pdfKey = await saveFile(`proposals/${row.id}/v${input.version}-signed.pdf`, pdf, "application/pdf");
  await setSignaturePdf(sigId, pdfKey);

  const s = v.snapshot;
  const email = notifyOwner({
    subject: `Signed: proposal for ${s.client.name}`,
    text: [
      `${input.name}${input.title ? ` (${input.title})` : ""} signed the proposal for ${s.client.name}.`,
      "",
      `Total: ${formatMoney(s.totalMinor, s.currency)}`,
      `Version: ${s.version}`,
      `Signed by: ${input.name} <${input.email}>`,
      `Fingerprint: ${v.contentSha256}`,
      "",
      `Proposal: ${clientUrl(row)}`,
      "The signed PDF is attached.",
    ].join("\n"),
    attachment: { filename: pdfFilename(s, true), content: pdf },
  });
  return { ok: true, email };
}
