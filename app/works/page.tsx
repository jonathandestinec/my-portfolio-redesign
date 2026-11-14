import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Bleed, Section } from "@/components/blocks/Section";
import { Intro, Lead } from "@/components/hero/Lead";
import { SiteShell } from "@/components/layout/SiteShell";
import { WorkCarousel } from "@/components/work/WorkCarousel";
import { playground } from "@/content/playground";
import { projects } from "@/content/projects";
import type { PlaygroundItem } from "@/content/types";
import { groupPlayground, homeSlides } from "@/lib/content";

export const metadata: Metadata = {
  title: "Works",
  description: "AgroHub, plus client sites and experiments I've built alone or with friends.",
};

function ItemList({ items, code }: { items: PlaygroundItem[]; code?: boolean }) {
  return (
    <ul className="list">
      {items.map((i) => (
        <li key={i.name} className="list__item">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span>
              <span className="medium">{i.name}</span>{" "}
              <span className="muted">· {i.role}</span>
            </span>
            <span className="actions !gap-x-4">
              {i.url ? (
                <a href={i.url} target="_blank" rel="noreferrer" className="text-link">
                  Visit ↗
                </a>
              ) : null}
              {code && i.repo ? (
                <a href={i.repo} target="_blank" rel="noreferrer" className="text-link">
                  Code ↗
                </a>
              ) : null}
            </span>
          </div>
          <p className="entry__text">{i.summary}</p>
          {i.stack?.length ? (
            <ul className="chips" aria-label="Stack">
              {i.stack.map((s) => (
                <li key={s} className="chip">
                  {s}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default function WorksPage() {
  const g = groupPlayground(playground);
  return (
    <SiteShell current="/works">
      <Intro narrow>
        <Lead
          title="Works."
          statements={[
            ["Two products I built end to end, and the smaller things around them."],
            ["Drag through the screens, or open the case study."],
          ]}
        />
      </Intro>

      <Bleed label="Project screens">
        <WorkCarousel slides={homeSlides()} label="Project screens" />
      </Bleed>

      <Section id="featured" title="Featured" label>
        <div className="cards">
          {projects.map((p) => (
            <article key={p.slug} className="card">
              <Link href={`/work/${p.slug}`} className="card__art relative block aspect-[16/10]">
                <Image
                  src={p.cover.src}
                  alt={p.cover.alt}
                  fill
                  sizes="(max-width: 679px) calc(100vw - 40px), 600px"
                  className="object-cover object-top"
                />
              </Link>
              <div className="card__body">
                <div className="flex flex-col gap-0.5">
                  <h3 className="m-0 font-[inherit] text-[15px] font-medium">
                    {p.name} <span className="muted font-normal">· {p.context}</span>
                  </h3>
                  <p className="muted">{p.role} · {p.year}</p>
                </div>
                <p className="text-pretty">{p.summary}</p>
                <ul className="chips" aria-label="Stack">
                  {p.stack.map((s) => (
                    <li key={s} className="chip">
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="actions">
                  <Link href={`/work/${p.slug}`} className="button">
                    Read the case study
                  </Link>
                  {p.links.live ? (
                    <a href={p.links.live} target="_blank" rel="noreferrer" className="text-link">
                      Visit ↗
                    </a>
                  ) : null}
                  {p.links.repo ? (
                    <a href={p.links.repo} target="_blank" rel="noreferrer" className="text-link">
                      Code ↗
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section
        id="clients"
        title="Client & collaborations"
        label
        sub="Sites I built end to end, or with a small team."
      >
        <ItemList items={g.client} />
      </Section>

      <Section id="experiments" title="Experiments" label sub="Things I built to learn something.">
        <ItemList items={g.experiment} code />
      </Section>
    </SiteShell>
  );
}
