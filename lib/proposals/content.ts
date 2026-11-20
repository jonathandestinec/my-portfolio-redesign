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
import type { Provider } from "./types";

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

export const proposalDefaults = {
  providerName: defaults.providerName,
  providerTitle: defaults.providerTitle,
  validityDays: Number(defaults.validityDays) || 14,
  intro: defaults.intro,
  contractTemplate: defaults.contractTemplate,
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
