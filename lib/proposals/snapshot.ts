import { bpsLabel, formatMoney, split } from "./money";
import { fillTemplate } from "./template";
import type { PaymentTerms, ProposalContent, ProposalOption, Provider, Snapshot, SnapshotOption, SnapshotWork } from "./types";

/** A piece of past work the owner can attach, from the portfolio's own content. */
export type CatalogItem = Omit<SnapshotWork, "note"> & { tags: string[] };

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const formatDate = (d: Date | string) => dateFmt.format(typeof d === "string" ? new Date(d) : d);

const bullets = (items: string[], empty: string) => (items.length ? items.map((i) => `- ${i}`).join("\n") : `- ${empty}`);
const clean = (items: string[]) => items.map((s) => s.trim()).filter(Boolean);

export const optionDays = (o: Pick<ProposalOption, "timeline">) => {
  const days = o.timeline.map((t) => t.day).filter((d): d is number => typeof d === "number" && d > 0);
  return days.length ? Math.max(...days) : null;
};

export function cleanOption(o: ProposalOption): ProposalOption {
  return {
    ...o,
    name: o.name.trim(),
    summary: o.summary.trim(),
    deliverables: o.deliverables
      .filter((d) => d.title.trim())
      .map((d) => ({ title: d.title.trim(), description: d.description.trim(), format: d.format.trim() })),
    timeline: o.timeline.filter((t) => t.title.trim()).map((t) => ({ title: t.title.trim(), day: t.day })),
  };
}

export function paymentText(terms: PaymentTerms, o: { priceMinor: number }, currency: ProposalContent["currency"]): string {
  const money = (m: number) => formatMoney(m, currency);
  const { depositMinor, balanceMinor } = split(o.priceMinor, terms.depositPercent);
  const lines = [
    terms.depositPercent > 0
      ? `- Deposit: ${terms.depositPercent}% (${money(depositMinor)}), due within ${terms.depositDueDays} days of signing. Work starts once it arrives. No deposit, no start.`
      : "- No deposit.",
    `- Balance: ${money(balanceMinor)}, invoiced on acceptance and due within ${terms.balanceDueDays} days. Every invoice states its due date.`,
    `- Late payment: ${bpsLabel(terms.lateFeeBps)} per month on overdue amounts.`,
    `- If a payment is ${terms.stopWorkDays} working days late, work pauses until it is paid, and the timeline moves by the same amount.`,
  ];
  return lines.join("\n");
}

/** Every value a contract template can use, for one option. */
export function contractValues(
  content: ProposalContent,
  option: ProposalOption,
  provider: Provider,
  issuedAt: Date,
  expiresAt: Date | null,
): Record<string, string> {
  const o = cleanOption(option);
  const money = (m: number) => formatMoney(m, content.currency);
  const { depositMinor, balanceMinor } = split(o.priceMinor, content.terms.depositPercent);
  const days = optionDays(o);
  const client = content.clientName.trim() || "the Client";
  const deliverables = o.deliverables.map((d) => `${d.title}${d.description ? `: ${d.description}` : ""}${d.format ? ` (delivered as: ${d.format})` : ""}`);
  const timeline = o.timeline.map((t) => (t.day ? `Working day ${t.day}: ${t.title}` : t.title));
  const overview = [
    `${provider.name} will deliver ${o.name ? `the ${o.name} option` : "the work"} for ${client}`,
    days ? `within ${days} working days of the deposit arriving` : null,
    `for ${money(o.priceMinor)}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    client,
    contact: content.contactName.trim() || client,
    provider: provider.name,
    providerTitle: provider.title,
    option: o.name || "the work",
    overview: o.summary ? `${overview} ${o.summary}` : overview,
    objectives: bullets(clean(content.objectives), "As described in this proposal."),
    scopeIn: bullets(o.deliverables.map((d) => d.title), "As described in this proposal."),
    scopeOut: bullets(clean(content.outOfScope), "Anything not listed under Scope (in)."),
    deliverables: bullets(deliverables, "As described in this proposal."),
    timeline: bullets(timeline, "To be agreed in writing at kickoff."),
    workingDays: days ? String(days) : "the agreed number of",
    responsibilities: bullets(
      content.responsibilities.filter((r) => r.item.trim()).map((r) => (r.by.trim() ? `${r.item.trim()} (by ${r.by.trim()})` : r.item.trim())),
      "The content, access and decisions the work depends on, in good time.",
    ),
    acceptance: bullets(clean(content.acceptance), "Each deliverable works as described in this proposal."),
    payment: paymentText(content.terms, o, content.currency),
    total: money(o.priceMinor),
    deposit: money(depositMinor),
    balance: money(balanceMinor),
    depositPercent: `${content.terms.depositPercent}%`,
    lateFee: bpsLabel(content.terms.lateFeeBps),
    currency: content.currency === "NGN" ? "Nigerian naira (₦)" : "US dollars ($)",
    date: formatDate(issuedAt),
    validUntil: expiresAt ? formatDate(expiresAt) : "no fixed date",
    // Names used by version 1 templates.
    scope: bullets(deliverables, "As described in this proposal."),
    milestones: bullets(timeline, "To be agreed in writing at kickoff."),
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
    return [
      {
        key: item.key,
        name: item.name,
        summary: item.summary,
        cover: item.cover,
        caseStudyUrl: item.caseStudyUrl,
        liveUrl: item.liveUrl,
        note: pick.note.trim(),
      },
    ];
  });
  const options: SnapshotOption[] = content.options
    .map(cleanOption)
    .filter((o) => o.name || o.deliverables.length || o.priceMinor > 0)
    .map((o) => ({
      ...o,
      ...split(o.priceMinor, content.terms.depositPercent),
      workingDays: optionDays(o),
      contract: fillTemplate(content.contractBody, contractValues(content, o, provider, issuedAt, expiresAt)).trim(),
    }));
  return {
    schema: 2,
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
    objectives: clean(content.objectives),
    work,
    options,
    outOfScope: clean(content.outOfScope),
    responsibilities: content.responsibilities
      .filter((r) => r.item.trim())
      .map((r) => ({ item: r.item.trim(), by: r.by.trim() })),
    acceptance: clean(content.acceptance),
    terms: { ...content.terms },
    currency: content.currency,
  };
}

/** The option the page shows first: the recommended one, else the first. */
export const defaultOption = <T extends { recommended: boolean }>(options: T[]) => options.find((o) => o.recommended) ?? options[0];

/** Problems that block sending. Empty when the proposal is ready. */
export function readiness(content: ProposalContent): string[] {
  const out: string[] = [];
  if (!content.clientName.trim()) out.push("Add the client’s name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.contactEmail.trim())) out.push("Add a valid contact email.");
  if (!content.brief.trim()) out.push("Write “In your words”.");
  if (!clean(content.objectives).length) out.push("Add at least one objective.");
  const options = content.options.map(cleanOption).filter((o) => o.name || o.deliverables.length || o.priceMinor > 0);
  if (!options.length) out.push("Add at least one option.");
  options.forEach((o, i) => {
    const label = o.name || `Option ${i + 1}`;
    if (!o.name) out.push(`Name option ${i + 1}.`);
    if (!o.deliverables.length) out.push(`${label}: add at least one deliverable.`);
    if (o.priceMinor <= 0) out.push(`${label}: set a price.`);
  });
  if (options.filter((o) => o.recommended).length > 1) out.push("Recommend one option at most.");
  if (!clean(content.outOfScope).length) out.push("List at least one thing that is out of scope.");
  if (!clean(content.acceptance).length) out.push("Add acceptance criteria.");
  if (!content.contractBody.trim()) out.push("Pick a contract template.");
  return out;
}
