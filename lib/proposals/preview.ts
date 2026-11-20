import "server-only";
import { provider, workCatalog } from "./content";
import { snapshotHash } from "./hash";
import { getVersion, hasUnsentChanges, type ProposalRow } from "./repo";
import { buildSnapshot } from "./snapshot";
import { expiryFrom } from "./status";
import { proposalDefaults } from "./content";
import type { Snapshot } from "./types";

/**
 * What the client would see if the owner pressed Send now: the saved content as
 * the next version, or the current version when nothing has changed.
 */
export async function previewSnapshot(row: ProposalRow): Promise<{ snapshot: Snapshot; contentSha256: string; isNext: boolean }> {
  if (row.version > 0 && !(await hasUnsentChanges(row))) {
    const v = (await getVersion(row.id, row.version))!;
    return { snapshot: v.snapshot, contentSha256: v.contentSha256, isNext: false };
  }
  const now = new Date();
  const expiresAt = row.expiresAt && row.expiresAt > now ? row.expiresAt : expiryFrom(now, proposalDefaults.validityDays);
  const snapshot = buildSnapshot({ content: row.content, version: row.version + 1, issuedAt: now, expiresAt, provider: provider(), catalog: workCatalog() });
  return { snapshot, contentSha256: snapshotHash(snapshot), isNext: true };
}
