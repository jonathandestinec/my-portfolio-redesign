import { z } from "zod";
import { CURRENCIES, type ProposalContent } from "./types";

const text = (max: number) => z.string().max(max).default("");

/** What the admin may save. Unknown fields are dropped; amounts must be whole minor units. */
export const contentSchema = z.object({
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
  tags: z.array(z.string().max(40)).max(30).default([]),
  work: z.array(z.object({ key: z.string().max(120), note: text(300) })).max(12).default([]),
  scope: z.array(z.object({ title: text(200), description: text(1000) })).max(40).default([]),
  milestones: z
    .array(
      z.object({
        title: text(200),
        description: text(1000),
        amountMinor: z.number().int().min(0).max(1e13),
        due: text(80),
      }),
    )
    .max(30)
    .default([]),
  currency: z.enum(CURRENCIES).default("NGN"),
  contractTemplate: z.string().max(80).nullable().default(null),
  contractBody: text(60000),
});

export function parseContent(input: unknown): ProposalContent {
  return contentSchema.parse(input);
}
