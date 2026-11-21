import { z } from "zod";
import { upgradeContent } from "./upgrade";
import { CURRENCIES, type ProposalContent } from "./types";

const text = (max: number) => z.string().max(max).default("");
const minor = z.number().int().min(0).max(1e13);

const option = z.object({
  id: z.string().regex(/^[a-z0-9]{1,16}$/),
  name: text(80),
  summary: text(500),
  deliverables: z.array(z.object({ title: text(200), description: text(1000), format: text(200) })).max(30).default([]),
  timeline: z.array(z.object({ title: text(200), day: z.number().int().min(0).max(999).nullable() })).max(30).default([]),
  priceMinor: minor,
  recommended: z.boolean().default(false),
});

/** What the admin may save. Unknown fields are dropped; amounts must be whole minor units. */
export const contentSchema = z.object({
  schema: z.literal(2).default(2),
  clientName: text(120),
  clientLogoKey: z
    .string()
    .regex(/^proposals\/[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/)
    .nullable()
    .default(null),
  contactName: text(120),
  contactEmail: text(200),
  intro: text(4000),
  brief: text(8000),
  objectives: z.array(text(400)).max(12).default([]),
  tags: z.array(z.string().max(40)).max(30).default([]),
  work: z.array(z.object({ key: z.string().max(120), note: text(300) })).max(12).default([]),
  options: z.array(option).min(1).max(3),
  outOfScope: z.array(text(400)).max(30).default([]),
  responsibilities: z.array(z.object({ item: text(400), by: text(120) })).max(30).default([]),
  acceptance: z.array(text(400)).max(30).default([]),
  terms: z.object({
    depositPercent: z.number().int().min(0).max(100),
    depositDueDays: z.number().int().min(0).max(90),
    balanceDueDays: z.number().int().min(0).max(120),
    lateFeeBps: z.number().int().min(0).max(1000),
    stopWorkDays: z.number().int().min(1).max(90),
  }),
  currency: z.enum(CURRENCIES).default("NGN"),
  contractTemplate: z.string().max(80).nullable().default(null),
  contractBody: text(60000),
  discoveryId: z.string().uuid().nullable().default(null),
});

export function parseContent(input: unknown): ProposalContent {
  return contentSchema.parse(upgradeContent(input)) as ProposalContent;
}
