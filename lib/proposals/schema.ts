import { sql } from "drizzle-orm";
import { bigint, integer, jsonb, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import type { ProposalContent, Snapshot, StoredStatus } from "./types";

// Mirrors db/migrations/0001_proposals.sql.

const ts = (name: string) => timestamp(name, { withTimezone: true });

export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull(),
  token: text("token").notNull().unique(),
  status: text("status").$type<StoredStatus>().notNull().default("draft"),
  version: integer("version").notNull().default(0),
  content: jsonb("content").$type<ProposalContent>().notNull(),
  passcodeHash: text("passcode_hash"),
  expiresAt: ts("expires_at"),
  sentAt: ts("sent_at"),
  signedAt: ts("signed_at"),
  withdrawnAt: ts("withdrawn_at"),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const proposalVersions = pgTable(
  "proposal_versions",
  {
    proposalId: uuid("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    snapshot: jsonb("snapshot").$type<Snapshot>().notNull(),
    contentSha256: text("content_sha256").notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.proposalId, t.version] })],
);

export const proposalViews = pgTable("proposal_views", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  proposalId: uuid("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  viewedAt: ts("viewed_at").notNull().defaultNow(),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
});

export const signatures = pgTable(
  "signatures",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    proposalId: uuid("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    role: text("role").$type<"client" | "provider">().notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    title: text("title"),
    method: text("method").$type<"typed" | "drawn">().notNull(),
    signatureKey: text("signature_key").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    signedAt: ts("signed_at").notNull().defaultNow(),
    contentSha256: text("content_sha256").notNull(),
    pdfKey: text("pdf_key"),
  },
  (t) => [unique().on(t.proposalId, t.version, t.role)],
);

export type ProposalRow = typeof proposals.$inferSelect;
export type SignatureRow = typeof signatures.$inferSelect;
