/** Shapes shared by the proposals admin, the client page, the PDF and the database. */

export const CURRENCIES = ["NGN", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export type StoredStatus = "draft" | "sent" | "viewed" | "signed" | "withdrawn";
/** What the admin and client see: stored status plus time-based expiry. */
export type Status = StoredStatus | "expired";

export type WorkPick = {
  /** `project:<slug>` for a case study; `client:<slug>` or `experiment:<slug>` for an item from /works. */
  key: string;
  /** One line on why this is relevant to the client. Optional. */
  note: string;
};

/** Something handed over, and the form it arrives in ("Live site on your domain", "Figma file"). */
export type Deliverable = { title: string; description: string; format: string };

/** A milestone, counted in working days from the day the deposit arrives. */
export type TimelineStep = { title: string; day: number | null };

/** One of up to three ways to do the work. The client picks one when signing. */
export type ProposalOption = {
  id: string;
  name: string;
  summary: string;
  deliverables: Deliverable[];
  timeline: TimelineStep[];
  /** Integer minor units (kobo or cents). Never a float. */
  priceMinor: number;
  recommended: boolean;
};

export type Responsibility = { item: string; by: string };

/** Payment schedule. Percentages are integers; the late fee is in basis points (150 = 1.5%). */
export type PaymentTerms = {
  depositPercent: number;
  depositDueDays: number;
  balanceDueDays: number;
  lateFeeBps: number;
  stopWorkDays: number;
};

export const DEFAULT_TERMS: PaymentTerms = {
  depositPercent: 50,
  depositDueDays: 3,
  balanceDueDays: 15,
  lateFeeBps: 150,
  stopWorkDays: 10,
};

/** What the owner edits. Stored as `proposals.content` (jsonb). */
export type ProposalContent = {
  schema: 2;
  clientName: string;
  clientLogoKey: string | null;
  contactName: string;
  contactEmail: string;
  intro: string;
  /** "In your words": the client's own description of the problem, from discovery. */
  brief: string;
  /** The measurable results both sides agree on. */
  objectives: string[];
  tags: string[];
  work: WorkPick[];
  options: ProposalOption[];
  outOfScope: string[];
  responsibilities: Responsibility[];
  acceptance: string[];
  terms: PaymentTerms;
  currency: Currency;
  contractTemplate: string | null;
  contractBody: string;
  discoveryId: string | null;
};

/** A resolved piece of past work, frozen into the snapshot so the client sees what was sent. */
export type SnapshotWork = {
  key: string;
  name: string;
  summary: string;
  note: string;
  cover: { src: string; alt: string } | null;
  caseStudyUrl: string | null;
  liveUrl: string | null;
};

export type Provider = {
  name: string;
  title: string;
  email: string;
  website: string;
};

export type SnapshotOption = ProposalOption & {
  depositMinor: number;
  balanceMinor: number;
  /** Last milestone's working day, or null when no timeline was given. */
  workingDays: number | null;
  /** The agreement filled in for this option. */
  contract: string;
};

/** Everything the client sees for one version. Immutable once written. */
export type Snapshot = {
  schema: 2;
  version: number;
  issuedAt: string;
  expiresAt: string | null;
  provider: Provider;
  client: { name: string; logoKey: string | null; contactName: string; contactEmail: string };
  intro: string;
  brief: string;
  objectives: string[];
  work: SnapshotWork[];
  options: SnapshotOption[];
  outOfScope: string[];
  responsibilities: Responsibility[];
  acceptance: string[];
  /** Null for proposals sent before payment terms existed (their contract carries its own). */
  terms: PaymentTerms | null;
  currency: Currency;
};

export const newOptionId = () => Math.random().toString(36).slice(2, 10);

export const emptyOption = (name = "", recommended = false): ProposalOption => ({
  id: newOptionId(),
  name,
  summary: "",
  deliverables: [],
  timeline: [],
  priceMinor: 0,
  recommended,
});

export const emptyContent = (): ProposalContent => ({
  schema: 2,
  clientName: "",
  clientLogoKey: null,
  contactName: "",
  contactEmail: "",
  intro: "",
  brief: "",
  objectives: [],
  tags: [],
  work: [],
  options: [emptyOption("Essential"), emptyOption("Standard", true), emptyOption("Complete")],
  outOfScope: [],
  responsibilities: [],
  acceptance: [],
  terms: { ...DEFAULT_TERMS },
  currency: "NGN",
  contractTemplate: null,
  contractBody: "",
  discoveryId: null,
});
