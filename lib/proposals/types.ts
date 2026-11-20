/** Shapes shared by the proposals admin, the client page, the PDF and the database. */

export const CURRENCIES = ["NGN", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export type StoredStatus = "draft" | "sent" | "viewed" | "signed" | "withdrawn";
/** What the admin and client see: stored status plus time-based expiry. */
export type Status = StoredStatus | "expired";

export type WorkPick = {
  /** `project:<slug>` for a case study, `client:<slug>` for an item from /works. */
  key: string;
  /** One line on why this is relevant to the client. Optional. */
  note: string;
};

export type ScopeItem = { title: string; description: string };

export type Milestone = {
  title: string;
  description: string;
  /** Integer minor units (kobo or cents). Never a float. */
  amountMinor: number;
  /** Free text, e.g. "Week 2" or "15 Jan 2027". */
  due: string;
};

/** What the owner edits. Stored as `proposals.content` (jsonb). */
export type ProposalContent = {
  clientName: string;
  clientLogoKey: string | null;
  contactName: string;
  contactEmail: string;
  intro: string;
  brief: string;
  tags: string[];
  work: WorkPick[];
  scope: ScopeItem[];
  milestones: Milestone[];
  currency: Currency;
  contractTemplate: string | null;
  contractBody: string;
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

/** Everything the client sees for one version. Immutable once written. */
export type Snapshot = {
  version: number;
  issuedAt: string;
  expiresAt: string | null;
  provider: Provider;
  client: { name: string; logoKey: string | null; contactName: string; contactEmail: string };
  intro: string;
  brief: string;
  work: SnapshotWork[];
  scope: ScopeItem[];
  milestones: Milestone[];
  currency: Currency;
  totalMinor: number;
  contract: string;
};

export const emptyContent = (): ProposalContent => ({
  clientName: "",
  clientLogoKey: null,
  contactName: "",
  contactEmail: "",
  intro: "",
  brief: "",
  tags: [],
  work: [],
  scope: [],
  milestones: [],
  currency: "NGN",
  contractTemplate: null,
  contractBody: "",
});
