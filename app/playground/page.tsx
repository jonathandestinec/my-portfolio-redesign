import type { Metadata } from "next";
import { RowList, type Row } from "@/components/blocks/RowList";
import { ArrowLink } from "@/components/cta/ArrowLink";
import { PageHero } from "@/components/hero/PageHero";
import { SiteShell } from "@/components/layout/SiteShell";
import { playground } from "@/content/playground";
import type { PlaygroundItem } from "@/content/types";
import { groupPlayground } from "@/lib/content";

export const metadata: Metadata = {
  title: "Pet projects & experiments",
  description:
    "Smaller things I've built, alone or with friends. The big one is AgroHub.",
};

function toRows(items: PlaygroundItem[], experiment: boolean): Row[] {
  return items.map((i) => ({
    label: i.role,
    title: i.name,
    body: i.summary,
    tag: i.stack?.join(" · "),
    aside:
      i.url || (experiment && i.repo) ? (
        <span className="flex flex-wrap justify-end gap-x-4 gap-y-1">
          {i.url ? (
            <ArrowLink href={i.url} external>
              Visit
            </ArrowLink>
          ) : null}
          {experiment && i.repo ? (
            <ArrowLink href={i.repo} external>
              Code
            </ArrowLink>
          ) : null}
        </span>
      ) : undefined,
  }));
}

export default function Playground() {
  const g = groupPlayground(playground);
  return (
    <SiteShell variant="detail" back={{ href: "/", label: "← Destine Jonathan" }}>
      <PageHero
        variant="minor"
        title="Pet projects & experiments"
        body="Smaller things I've built, alone or with friends. The big one is AgroHub."
      />
      <section className="py-8">
        <h2 className="mb-4 text-[13px] font-normal text-ink-faint">
          Client &amp; collaborations
        </h2>
        <RowList rows={toRows(g.client, false)} />
      </section>
      <section className="py-8">
        <h2 className="mb-4 text-[13px] font-normal text-ink-faint">Experiments</h2>
        <RowList rows={toRows(g.experiment, true)} />
      </section>
    </SiteShell>
  );
}
