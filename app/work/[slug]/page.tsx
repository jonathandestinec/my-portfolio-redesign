import type { Metadata } from "next";
import Image from "next/image";
import { cache } from "react";
import { notFound } from "next/navigation";
import { MetaTable } from "@/components/blocks/MetaTable";
import { Timeline } from "@/components/blocks/Timeline";
import { ArrowLink } from "@/components/cta/ArrowLink";
import { CtaGroup } from "@/components/cta/CtaGroup";
import { PageHero } from "@/components/hero/PageHero";
import { SiteShell } from "@/components/layout/SiteShell";
import { ScrollBlur } from "@/components/motion/ScrollBlur";
import { projects } from "@/content/projects";
import { getNextProject, getProject } from "@/lib/content";

// First request for an unlisted slug must wait for the full render so notFound() yields a real 404.
export const ensureStatic = "navigation";

// `dynamicParams` is not allowed with cacheComponents; unknown slugs 404 via notFound() in load().
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

const load = cache(async (slug: string) => {
  if (!projects.some((p) => p.slug === slug)) notFound();
  const project = getProject(slug);
  if (!project) notFound();
  return project;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await load(slug);
  return { title: project.name, description: project.summary };
}

const extLink = "underline decoration-line underline-offset-4 hover:decoration-ink";

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await load(slug);
  const next = getNextProject(slug);

  const rows: [string, React.ReactNode][] = [
    ["Role", project.role],
    ["Stack", project.stack.join(" · ")],
    ["Year", project.year],
    ["Status", project.status === "in-progress" ? "In progress" : "Shipped"],
  ];
  if (project.links.live || project.links.repo) {
    rows.push([
      "Links",
      <span key="links" className="flex flex-wrap gap-x-4 gap-y-1">
        {project.links.live ? (
          <a href={project.links.live} target="_blank" rel="noreferrer" className={extLink}>
            Live ↗
          </a>
        ) : null}
        {project.links.repo ? (
          <a href={project.links.repo} target="_blank" rel="noreferrer" className={extLink}>
            Code ↗
          </a>
        ) : null}
      </span>,
    ]);
  }

  return (
    <SiteShell variant="detail" back={{ href: "/", label: "← Destine Jonathan" }}>
      <PageHero
        variant="minor"
        title={project.name}
        body={project.summary}
        meta={<MetaTable rows={rows} />}
      />

      {project.timeline ? (
        <section className="py-8">
          <h2 className="mb-4 text-[13px] font-normal text-ink-faint">
            How it&apos;s shipping
          </h2>
          <Timeline t={project.timeline} />
        </section>
      ) : null}

      <div className="space-y-10 py-8">
        {project.images.map((img) => {
          const w = img.width ?? 1600;
          const h = img.height ?? 1000;
          const phone = h > w;
          return (
            <figure key={img.src} className="m-0">
              <ScrollBlur>
                <div className="rounded-2xl bg-paper-raised p-[clamp(12px,3vw,40px)]">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={w}
                    height={h}
                    sizes="(min-width: 768px) 900px, 100vw"
                    className={
                      phone
                        ? "mx-auto h-auto w-full max-w-[360px] rounded-[28px]"
                        : "h-auto w-full rounded-xl"
                    }
                  />
                </div>
              </ScrollBlur>
              {img.caption ? (
                <figcaption className="mt-3 text-[13px] text-ink-faint">
                  {img.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>

      {next ? (
        <div className="py-6">
          <ArrowLink href={`/work/${next.slug}`}>Next project: {next.name}</ArrowLink>
        </div>
      ) : null}

      <section className="py-12">
        <p className="font-display text-[clamp(1.875rem,3vw,2.75rem)] font-medium leading-[1.2] tracking-[-0.02em] text-ink-muted">
          Like what you see? Let&apos;s talk.
        </p>
        <div className="mt-6">
          <CtaGroup id="cta-more-work" />
        </div>
      </section>
    </SiteShell>
  );
}
