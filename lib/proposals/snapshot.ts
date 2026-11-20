import { formatMoney, totalMinor } from "./money";
import { fillTemplate } from "./template";
import type { ProposalContent, Provider, Snapshot, SnapshotWork } from "./types";

/** A piece of past work the owner can attach, from the portfolio's own content. */
export type CatalogItem = Omit<SnapshotWork, "note"> & { tags: string[] };

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const formatDate = (d: Date | string) => dateFmt.format(typeof d === "string" ? new Date(d) : d);

export function contractValues(
  content: ProposalContent,
  provider: Provider,
  issuedAt: Date,
  expiresAt: Date | null,
): Record<string, string> {
  const total = totalMinor(content.milestones);
  const scope = content.scope.filter((s) => s.title.trim());
  const milestones = content.milestones.filter((m) => m.title.trim());
  return {
    client: content.clientName.trim() || "the Client",
    contact: content.contactName.trim() || content.clientName.trim() || "the Client",
    provider: provider.name,
    providerTitle: provider.title,
    total: formatMoney(total, content.currency),
    currency: content.currency === "NGN" ? "Nigerian naira (₦)" : "US dollars ($)",
    date: formatDate(issuedAt),
    validUntil: expiresAt ? formatDate(expiresAt) : "no fixed date",
    scope: scope.length
      ? scope.map((s) => `- ${s.title.trim()}${s.description.trim() ? `: ${s.description.trim()}` : ""}`).join("\n")
      : "- As described in this proposal.",
    milestones: milestones.length
      ? milestones
          .map((m) => `- ${m.title.trim()}${m.due.trim() ? ` (${m.due.trim()})` : ""}: ${formatMoney(m.amountMinor, content.currency)}`)
          .join("\n")
      : "- Paid in full on delivery.",
  };
}

export function buildSnapshot(input: {
  content: ProposalContent;
  version: number;
  issuedAt: Date;
  expiresAt: Date | null;
  provider: Provider;
  catalog: CatalogItem[];
}): Snapshot {
  const { content, provider, issuedAt, expiresAt } = input;
  const byKey = new Map(input.catalog.map((c) => [c.key, c]));
  const work: SnapshotWork[] = content.work.flatMap((pick) => {
    const item = byKey.get(pick.key);
    if (!item) return [];
    const { tags: _tags, ...rest } = item;
    return [{ ...rest, note: pick.note.trim() }];
  });
  return {
    version: input.version,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    provider,
    client: {
      name: content.clientName.trim(),
      logoKey: content.clientLogoKey,
      contactName: content.contactName.trim(),
      contactEmail: content.contactEmail.trim(),
    },
    intro: content.intro.trim(),
    brief: content.brief.trim(),
    work,
    scope: content.scope.filter((s) => s.title.trim()),
    milestones: content.milestones.filter((m) => m.title.trim()),
    currency: content.currency,
    totalMinor: totalMinor(content.milestones),
    contract: fillTemplate(content.contractBody, contractValues(content, provider, issuedAt, expiresAt)).trim(),
  };
}

/** Problems that block sending. Empty when the proposal is ready. */
export function readiness(content: ProposalContent): string[] {
  const out: string[] = [];
  if (!content.clientName.trim()) out.push("Add the client’s name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.contactEmail.trim())) out.push("Add a valid contact email.");
  if (!content.brief.trim()) out.push("Write the brief.");
  if (!content.milestones.some((m) => m.title.trim())) out.push("Add at least one milestone.");
  if (!content.contractBody.trim()) out.push("Pick a contract template.");
  return out;
}
