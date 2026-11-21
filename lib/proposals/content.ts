import "server-only";
import fs from "node:fs";
import path from "node:path";
import defaults from "@/content/proposal-defaults.json";
import { playground } from "@/content/playground";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/site-url";
import type { CatalogItem } from "./snapshot";
import { slugify } from "./tokens";
import { DEFAULT_TERMS, type PaymentTerms, type Provider } from "./types";

/** Contract templates, one JSON file each in content/contracts/ (edited in Studio). */
export type ContractTemplate = { slug: string; name: string; body: string };

export function loadContracts(): ContractTemplate[] {
  const dir = path.join(process.cwd(), "content", "contracts");
  return fs
    .readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const slug = f.replace(/\.json$/, "");
      const raw = JSON.parse(
        fs.readFileSync(/*turbopackIgnore: true*/ path.join(process.cwd(), "content", "contracts", `${slug}.json`), "utf8"),
      ) as { name: string; body: string };
      return { slug, name: raw.name, body: raw.body };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function intOr(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

/** "1.5" → 150 basis points, without floating-point surprises. */
export function percentToBps(v: unknown, fallback: number): number {
  const m = /^(\d{1,2})(?:\.(\d{1,2}))?$/.exec(String(v ?? "").trim());
  return m ? Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0")) : fallback;
}

export const proposalDefaults = {
  providerName: defaults.providerName,
  providerTitle: defaults.providerTitle,
  validityDays: Number(defaults.validityDays) || 14,
  intro: defaults.intro,
  contractTemplate: defaults.contractTemplate,
  terms: {
    depositPercent: intOr(defaults.depositPercent, DEFAULT_TERMS.depositPercent),
    depositDueDays: intOr(defaults.depositDueDays, DEFAULT_TERMS.depositDueDays),
    balanceDueDays: intOr(defaults.balanceDueDays, DEFAULT_TERMS.balanceDueDays),
    lateFeeBps: percentToBps(defaults.lateFeePercent, DEFAULT_TERMS.lateFeeBps),
    stopWorkDays: intOr(defaults.stopWorkDays, DEFAULT_TERMS.stopWorkDays),
  } satisfies PaymentTerms,
};

export function provider(): Provider {
  return {
    name: proposalDefaults.providerName,
    title: proposalDefaults.providerTitle,
    email: site.email,
    website: siteUrl(),
  };
}

/** Everything that can be attached as relevant work: case studies first, then client sites and experiments. */
export function workCatalog(): CatalogItem[] {
  const base = siteUrl();
  return [
    ...projects.map((p) => ({
      key: `project:${p.slug}`,
      name: p.name,
      summary: p.summary,
      cover: { src: p.cover.src, alt: p.cover.alt },
      caseStudyUrl: `${base}/work/${p.slug}`,
      liveUrl: p.links.live ?? null,
      tags: p.tags,
    })),
    ...playground.map((i) => ({
        key: `${i.group}:${slugify(i.name)}`,
        name: i.name,
        summary: i.summary,
        cover: null,
        caseStudyUrl: null,
        liveUrl: i.url ?? null,
        tags: i.tags,
      })),
  ];
}
