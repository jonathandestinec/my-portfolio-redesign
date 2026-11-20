import "server-only";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "./db";
import { emptyDiscovery, type DiscoveryNotes } from "./discovery-types";
import type { DiscoveryRow } from "./schema";
import type { ProposalContent } from "./types";

const { discoveries } = schema;
const t = (max: number) => z.string().max(max).default("");

const notesSchema = z.object({
  contactName: t(120),
  contactRole: t(120),
  contactEmail: t(200),
  contactPhone: t(40),
  metOn: t(40),
  answers: z.object({ q1: t(6000), q2: t(6000), q3: t(6000), q4: t(6000), q5: t(6000) }),
  valueNumber: t(400),
  decisionMaker: t(200),
  followUp: z.enum(["", "yes", "maybe", "no"]).default(""),
  followUpOn: t(40),
  notes: t(8000),
});

export const parseDiscovery = (input: unknown): DiscoveryNotes => notesSchema.parse(input);

export async function listDiscoveries(): Promise<DiscoveryRow[]> {
  return db().select().from(discoveries).orderBy(desc(discoveries.updatedAt));
}

export async function getDiscovery(id: string): Promise<DiscoveryRow | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await db().select().from(discoveries).where(eq(discoveries.id, id));
  return row ? { ...row, notes: { ...emptyDiscovery(), ...row.notes, answers: { ...emptyDiscovery().answers, ...row.notes.answers } } } : null;
}

export async function createDiscovery(): Promise<string> {
  const [row] = await db().insert(discoveries).values({ notes: emptyDiscovery() }).returning({ id: discoveries.id });
  return row.id;
}

export async function saveDiscovery(id: string, business: string, notes: DiscoveryNotes): Promise<void> {
  await db().update(discoveries).set({ business, notes, updatedAt: new Date() }).where(eq(discoveries.id, id));
}

export async function deleteDiscovery(id: string): Promise<void> {
  await db().delete(discoveries).where(eq(discoveries.id, id));
}

export async function linkDiscovery(id: string, proposalId: string): Promise<void> {
  await db().update(discoveries).set({ proposalId, updatedAt: new Date() }).where(eq(discoveries.id, id));
}

/**
 * What a proposal starts with when made from discovery notes: their words for
 * the problem become "In your words", the value number becomes an objective,
 * and the decision-maker becomes the signer.
 */
export function seedFromDiscovery(d: Pick<DiscoveryRow, "id" | "business" | "notes">): Partial<ProposalContent> {
  const n = d.notes;
  const signer = n.decisionMaker.trim() || n.contactName.trim();
  return {
    clientName: d.business.trim(),
    contactName: signer,
    contactEmail: n.decisionMaker.trim() && n.decisionMaker.trim() !== n.contactName.trim() ? "" : n.contactEmail.trim(),
    brief: n.answers.q2.trim(),
    objectives: n.valueNumber.trim() ? [`Fix this: ${n.valueNumber.trim()}`] : [],
    discoveryId: d.id,
  };
}
