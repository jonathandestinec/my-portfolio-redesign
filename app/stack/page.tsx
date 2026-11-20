import type { Metadata } from "next";
import { Facts } from "@/components/blocks/Facts";
import { Section } from "@/components/blocks/Section";
import { ContribGrid } from "@/components/github/ContribGrid";
import { Intro, Lead } from "@/components/hero/Lead";
import { SiteShell } from "@/components/layout/SiteShell";
import { StackGrid } from "@/components/stack/StackGrid";
import { stack, stackCategories, stackNotes } from "@/content/stack";
import { getContributions } from "@/lib/github-cached";

export const metadata: Metadata = {
  title: "Stack",
  description: "The tools I build with, and what I use each one for.",
};

export default async function StackPage() {
  const cal = await getContributions();
  return (
    <SiteShell current="/stack">
      <Intro narrow>
        <Lead
          title="Stack."
          statements={[
            ["Next.js, Postgres and n8n do most of the work."],
            ["Here's the rest, and what I use each part for."],
          ]}
        />
      </Intro>

      <Section id="tools" title="Tools" label>
        <div className="card">
          <div className="card__body">
            <StackGrid items={stack} />
          </div>
        </div>
      </Section>

      <Section id="how" title="How I use them" label>
        <Facts
          rows={stackCategories
            .filter((c) => c.id !== "all")
            .map((c) => [c.label, <span key={c.id}>{stackNotes[c.id as keyof typeof stackNotes]}</span>])}
        />
      </Section>

      <Section id="activity" title="GitHub activity" label sub="Commits, pull requests and reviews over the last year.">
        <div className="card">
          <div className="card__body overflow-x-auto">
            <ContribGrid cal={cal} />
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
