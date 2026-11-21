import {
  DEFAULT_TERMS,
  emptyContent,
  type Deliverable,
  type ProposalContent,
  type ProposalOption,
  type Snapshot,
  type SnapshotOption,
} from "./types";

/**
 * Proposals saved before options existed (schema 1) had one `scope` list and
 * priced `milestones`. They are upgraded on read: the scope becomes the
 * deliverables of a single option, priced at the old total.
 */
type V1Milestone = { title: string; description?: string; amountMinor: number; due?: string };
type V1Scope = { title: string; description?: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

function v1Option(scope: V1Scope[] = [], milestones: V1Milestone[] = []): ProposalOption {
  const deliverables: Deliverable[] = scope.map((s) => ({ title: s.title, description: s.description ?? "", format: "" }));
  return {
    id: "v1",
    name: "Proposal",
    summary: "",
    deliverables,
    timeline: milestones.map((m) => ({ title: m.due ? `${m.title} (${m.due})` : m.title, day: null })),
    priceMinor: milestones.reduce((a, m) => a + (Number.isSafeInteger(m.amountMinor) ? m.amountMinor : 0), 0),
    recommended: true,
  };
}

export function upgradeContent(raw: unknown): ProposalContent {
  const base = emptyContent();
  if (!isObj(raw)) return base;
  if (raw.schema === 2) return { ...base, ...(raw as Partial<ProposalContent>), terms: { ...DEFAULT_TERMS, ...((raw.terms as object) ?? {}) } } as ProposalContent;
  const v1 = raw as Record<string, unknown> & { scope?: V1Scope[]; milestones?: V1Milestone[] };
  const { scope, milestones, ...rest } = v1;
  return {
    ...base,
    ...(rest as Partial<ProposalContent>),
    schema: 2,
    options: [v1Option(scope, milestones)],
    terms: { ...DEFAULT_TERMS },
    discoveryId: null,
  };
}

export function upgradeSnapshot(raw: unknown): Snapshot {
  const s = raw as Record<string, unknown>;
  if (s.schema === 2) return raw as Snapshot;
  const v1 = raw as {
    version: number;
    issuedAt: string;
    expiresAt: string | null;
    provider: Snapshot["provider"];
    client: Snapshot["client"];
    intro: string;
    brief: string;
    work: Snapshot["work"];
    scope: V1Scope[];
    milestones: V1Milestone[];
    currency: Snapshot["currency"];
    totalMinor: number;
    contract: string;
  };
  const opt = v1Option(v1.scope, v1.milestones);
  const option: SnapshotOption = { ...opt, depositMinor: 0, balanceMinor: v1.totalMinor, workingDays: null, contract: v1.contract };
  return {
    schema: 2,
    version: v1.version,
    issuedAt: v1.issuedAt,
    expiresAt: v1.expiresAt,
    provider: v1.provider,
    client: v1.client,
    intro: v1.intro,
    brief: v1.brief,
    objectives: [],
    work: v1.work,
    options: [option],
    outOfScope: [],
    responsibilities: [],
    acceptance: [],
    terms: null,
    currency: v1.currency,
  };
}
