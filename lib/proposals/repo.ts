import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { loadContracts, provider, proposalDefaults, workCatalog } from "./content";
import { db, schema } from "./db";
import { snapshotHash } from "./hash";
import { buildSnapshot, defaultOption } from "./snapshot";
import { upgradeContent, upgradeSnapshot } from "./upgrade";
import { effectiveStatus, expiryFrom, isEditable } from "./status";
import { newToken, slugify } from "./tokens";
import { emptyContent, type ProposalContent, type Snapshot, type Status } from "./types";

const { proposals, proposalVersions, proposalViews, signatures } = schema;

export type { ProposalRow, SignatureRow } from "./schema";
import type { ProposalRow, SignatureRow } from "./schema";

export type ListItem = {
  id: string;
  slug: string;
  token: string;
  clientName: string;
  status: Status;
  version: number;
  totalMinor: number;
  currency: ProposalContent["currency"];
  /** Number of options; totalMinor is the recommended (or first) one. */
  options: number;
  views: number;
  lastViewedAt: Date | null;
  sentAt: Date | null;
  signedAt: Date | null;
  expiresAt: Date | null;
  updatedAt: Date;
};

/** Rows saved before options existed are upgraded on read. */
const up = (r: ProposalRow): ProposalRow => ({ ...r, content: upgradeContent(r.content) });

export async function listProposals(): Promise<ListItem[]> {
  const rows = (await db().select().from(proposals).orderBy(desc(proposals.updatedAt))).map(up);
  if (!rows.length) return [];
  const stats = await db()
    .select({
      proposalId: proposalViews.proposalId,
      views: sql<number>`count(*)::int`,
      last: sql<string | null>`max(${proposalViews.viewedAt})`,
    })
    .from(proposalViews)
    .where(inArray(proposalViews.proposalId, rows.map((r) => r.id)))
    .groupBy(proposalViews.proposalId);
  const byId = new Map(stats.map((s) => [s.proposalId, s]));
  return rows.map((r) => {
    const s = byId.get(r.id);
    return {
      id: r.id,
      slug: r.slug,
      token: r.token,
      clientName: r.content.clientName || "Untitled client",
      status: effectiveStatus(r),
      version: r.version,
      totalMinor: defaultOption(r.content.options)?.priceMinor ?? 0,
      options: r.content.options.length,
      currency: r.content.currency,
      views: s?.views ?? 0,
      lastViewedAt: s?.last ? new Date(s.last) : null,
      sentAt: r.sentAt,
      signedAt: r.signedAt,
      expiresAt: r.expiresAt,
      updatedAt: r.updatedAt,
    };
  });
}

export async function getProposal(id: string): Promise<ProposalRow | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await db().select().from(proposals).where(eq(proposals.id, id));
  return row ? up(row) : null;
}

export async function getByToken(token: string): Promise<ProposalRow | null> {
  const [row] = await db().select().from(proposals).where(eq(proposals.token, token));
  return row ? up(row) : null;
}

export async function getVersion(id: string, version: number): Promise<{ snapshot: Snapshot; contentSha256: string } | null> {
  const [row] = await db()
    .select({ snapshot: proposalVersions.snapshot, contentSha256: proposalVersions.contentSha256 })
    .from(proposalVersions)
    .where(and(eq(proposalVersions.proposalId, id), eq(proposalVersions.version, version)));
  return row ? { snapshot: upgradeSnapshot(row.snapshot), contentSha256: row.contentSha256 } : null;
}

export async function getSignatures(id: string, version?: number): Promise<SignatureRow[]> {
  const where = version === undefined
    ? eq(signatures.proposalId, id)
    : and(eq(signatures.proposalId, id), eq(signatures.version, version));
  return db().select().from(signatures).where(where).orderBy(signatures.signedAt);
}

export async function getViews(id: string, limit = 20) {
  return db()
    .select()
    .from(proposalViews)
    .where(eq(proposalViews.proposalId, id))
    .orderBy(desc(proposalViews.viewedAt))
    .limit(limit);
}

/** A new proposal from your defaults; `seed` (a duplicate, or discovery notes) overrides them. */
export async function createProposal(seed?: Partial<ProposalContent>): Promise<string> {
  const contracts = loadContracts();
  const template = contracts.find((c) => c.slug === proposalDefaults.contractTemplate) ?? contracts[0];
  const content: ProposalContent = {
    ...emptyContent(),
    intro: proposalDefaults.intro,
    terms: { ...proposalDefaults.terms },
    contractTemplate: template?.slug ?? null,
    contractBody: template?.body ?? "",
    ...seed,
  };
  const [row] = await db()
    .insert(proposals)
    .values({ slug: slugify(content.clientName), token: newToken(), content })
    .returning({ id: proposals.id });
  return row.id;
}

export class ProposalLockedError extends Error {
  constructor() {
    super("This proposal is signed or withdrawn and can no longer change.");
  }
}

/** Saves the owner's edits. For a sent proposal the client keeps seeing the sent version until "Send update". */
export async function saveContent(id: string, content: ProposalContent): Promise<void> {
  const row = await getProposal(id);
  if (!row) throw new Error("Not found");
  if (!isEditable(effectiveStatus(row))) throw new ProposalLockedError();
  await db()
    .update(proposals)
    .set({ content, slug: slugify(content.clientName), updatedAt: new Date() })
    .where(and(eq(proposals.id, id), inArray(proposals.status, ["draft", "sent", "viewed"])));
}

/** Whether saved content differs from what the client currently sees. */
export async function hasUnsentChanges(row: ProposalRow): Promise<boolean> {
  if (row.version === 0) return true;
  const current = await getVersion(row.id, row.version);
  if (!current) return true;
  const next = buildSnapshot({
    content: row.content,
    version: row.version,
    issuedAt: new Date(current.snapshot.issuedAt),
    expiresAt: row.expiresAt,
    provider: current.snapshot.provider,
    catalog: workCatalog(),
  });
  // Compare what the client would see, ignoring when it was issued.
  return snapshotHash({ ...next, issuedAt: "", expiresAt: null }) !== snapshotHash({ ...current.snapshot, issuedAt: "", expiresAt: null });
}

/**
 * Publishes the saved content as a new version and records the owner's
 * signature on it. First send sets the expiry; later sends keep it unless it
 * has already passed.
 */
export async function sendProposal(
  id: string,
  owner: { signatureKey: string; ip: string | null; userAgent: string | null },
): Promise<{ version: number }> {
  const row = await getProposal(id);
  if (!row) throw new Error("Not found");
  const status = effectiveStatus(row);
  if (!isEditable(status)) throw new ProposalLockedError();

  const now = new Date();
  const expiresAt = row.expiresAt && row.expiresAt > now ? row.expiresAt : expiryFrom(now, proposalDefaults.validityDays);
  const version = row.version + 1;
  const p = provider();
  const snapshot = buildSnapshot({ content: row.content, version, issuedAt: now, expiresAt, provider: p, catalog: workCatalog() });
  const hash = snapshotHash(snapshot);

  // One transaction: a concurrent send collides on the (proposal, version) key and nothing is written.
  const [updated] = await db().batch([
    db()
      .update(proposals)
      .set({ version, status: "sent", sentAt: now, expiresAt, updatedAt: now })
      .where(and(eq(proposals.id, id), eq(proposals.version, row.version), inArray(proposals.status, ["draft", "sent", "viewed"])))
      .returning({ id: proposals.id }),
    db().insert(proposalVersions).values({ proposalId: id, version, snapshot, contentSha256: hash }),
    db().insert(signatures).values({
      proposalId: id,
      version,
      role: "provider",
      name: p.name,
      email: p.email,
      title: p.title,
      method: "typed",
      signatureKey: owner.signatureKey,
      ip: owner.ip,
      userAgent: owner.userAgent,
      signedAt: now,
      contentSha256: hash,
    }),
  ]);
  if (!updated.length) throw new Error("The proposal changed while sending. Reload and try again.");
  return { version };
}

export async function withdrawProposal(id: string): Promise<void> {
  await db()
    .update(proposals)
    .set({ status: "withdrawn", withdrawnAt: new Date(), updatedAt: new Date() })
    .where(and(eq(proposals.id, id), inArray(proposals.status, ["draft", "sent", "viewed"])));
}

export async function extendProposal(id: string, days: number): Promise<void> {
  const row = await getProposal(id);
  if (!row || row.status === "signed" || row.status === "withdrawn") return;
  const base = row.expiresAt && row.expiresAt > new Date() ? row.expiresAt : new Date();
  await db().update(proposals).set({ expiresAt: expiryFrom(base, days), updatedAt: new Date() }).where(eq(proposals.id, id));
}

export async function setPasscodeHash(id: string, hash: string | null): Promise<void> {
  await db().update(proposals).set({ passcodeHash: hash, updatedAt: new Date() }).where(eq(proposals.id, id));
}

export async function duplicateProposal(id: string): Promise<string> {
  const row = await getProposal(id);
  if (!row) throw new Error("Not found");
  return createProposal({ ...row.content, clientName: `${row.content.clientName} (copy)`, clientLogoKey: null, contactName: "", contactEmail: "" });
}

/** Drafts that were never sent can be deleted outright. */
export async function deleteDraft(id: string): Promise<void> {
  await db().delete(proposals).where(and(eq(proposals.id, id), eq(proposals.status, "draft"), eq(proposals.version, 0)));
}

export async function recordView(row: ProposalRow, ipHash: string | null, userAgent: string | null): Promise<void> {
  await db().insert(proposalViews).values({ proposalId: row.id, version: row.version, ipHash, userAgent: userAgent?.slice(0, 400) ?? null });
  if (row.status === "sent") {
    await db().update(proposals).set({ status: "viewed" }).where(and(eq(proposals.id, row.id), eq(proposals.status, "sent")));
  }
}

export type ClientSignature = {
  optionId: string | null;
  name: string;
  email: string;
  title: string | null;
  method: "typed" | "drawn";
  signatureKey: string;
  ip: string | null;
  userAgent: string | null;
  contentSha256: string;
};

/**
 * Signs atomically: the proposal flips to signed and the signature is stored in
 * one statement, only if the client signed the current version, it is still
 * open and not expired, and the fingerprint matches. Returns the signature id or null.
 */
export async function signProposal(id: string, version: number, sig: ClientSignature): Promise<string | null> {
  const result = await db().execute(sql`
    WITH current AS (
      SELECT v.proposal_id FROM proposal_versions v
      WHERE v.proposal_id = ${id} AND v.version = ${version} AND v.content_sha256 = ${sig.contentSha256}
    ), upd AS (
      UPDATE proposals SET status = 'signed', signed_at = now(), updated_at = now()
      WHERE id = ${id} AND version = ${version}
        AND status IN ('sent', 'viewed')
        AND (expires_at IS NULL OR expires_at > now())
        AND EXISTS (SELECT 1 FROM current)
      RETURNING id
    )
    INSERT INTO signatures (proposal_id, version, role, name, email, title, method, signature_key, ip, user_agent, content_sha256, option_id)
    SELECT upd.id, ${version}, 'client', ${sig.name}, ${sig.email}, ${sig.title}, ${sig.method}, ${sig.signatureKey},
           ${sig.ip}, ${sig.userAgent}, ${sig.contentSha256}, ${sig.optionId}
    FROM upd
    RETURNING id
  `);
  const rows = result.rows as { id: string }[];
  return rows[0]?.id ?? null;
}

export async function setSignaturePdf(signatureId: string, pdfKey: string): Promise<void> {
  await db().update(signatures).set({ pdfKey }).where(eq(signatures.id, signatureId));
}
