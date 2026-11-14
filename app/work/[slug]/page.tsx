import type { Metadata } from "next";
import Image from "next/image";
import { cache } from "react";
import { notFound } from "next/navigation";
import { Facts } from "@/components/blocks/Facts";
import { Timeline } from "@/components/blocks/Timeline";
import { Intro } from "@/components/hero/Lead";
import { SiteShell } from "@/components/layout/SiteShell";
import { Wordmark } from "@/components/layout/Wordmark";
import { projects } from "@/content/projects";
import type { Img } from "@/content/types";
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

function Shot({ img, phone, sizes }: { img: Img; phone?: boolean; sizes: string }) {
  const w = img.width ?? 1600;
  const h = img.height ?? 1000;
  if (phone) {
    return (
      <div className="shot-well shot-well--phone">
        <Image
          src={img.src}
          alt={img.alt}
          width={w}
          height={h}
          sizes="(max-width: 679px) 60vw, 280px"
          className="h-auto w-[min(280px,60%)] rounded-[22px]"
        />
      </div>
    );
  }
  return (
    <div className="shot-well">
      <Image src={img.src} alt={img.alt} width={w} height={h} sizes={sizes} className="block h-auto w-full" />
    </div>
  );
}

const ext = { target: "_blank", rel: "noreferrer", className: "text-link" } as const;

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await load(slug);
  const next = getNextProject(slug);
  const hero = project.images[0];

  const facts: [string, React.ReactNode][] = [
    ["What I did", project.role],
    ["Stack", project.stack.join(", ")],
    ["Year", project.year],
    ["Status", project.status === "in-progress" ? "In progress" : "Shipped"],
  ];
  if (project.links.live) {
    facts.push([
      "Website",
      <a key="w" href={project.links.live} {...ext}>
        {project.links.live.replace(/^https?:\/\//, "")}
      </a>,
    ]);
  }
  if (project.links.repo) {
    facts.push([
      "Code",
      <a key="c" href={project.links.repo} {...ext}>
        {project.links.repo.replace(/^https?:\/\/(www\.)?/, "")}
      </a>,
    ]);
  }

  return (
    <SiteShell
      current="/works"
      back={{ href: "/works", label: "← All works" }}
      sections={[
        { href: "#top", label: project.name },
        ...project.chapters.map((c) => ({ href: `#${c.id}`, label: c.title })),
      ]}
      closing="Like what you see? Let's talk."
    >
      <div id="top" className="scroll-mt-6">
        <Intro narrow logo={<Wordmark />}>
          <div className="lead">
            <h1>
              <span className="hl">{project.name}</span>: {project.tagline}
            </h1>
          </div>
        </Intro>

        <div className="col flex flex-col gap-8 pt-7">
          <div className="story">
            {project.story.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <Facts rows={facts} />
        </div>

        {hero ? (
          <figure className="wide case-image" data-reveal>
            <Shot img={hero} sizes="(max-width: 1119px) calc(100vw - 40px), 960px" />
          </figure>
        ) : null}
      </div>

      {project.timeline ? (
        <section className="col chapter" data-reveal>
          <div className="chapter__text">
            <h2 className="chapter__title">How it&apos;s shipping</h2>
          </div>
          <Timeline t={project.timeline} />
        </section>
      ) : null}

      {project.chapters.map((c) => (
        <section key={c.id} id={c.id} className="chapter">
          <div className="col chapter__text" data-reveal>
            <h2 className="chapter__title">{c.title}</h2>
            <p>{c.text}</p>
          </div>
          {c.images.length ? (
            <div className="wide shots" data-reveal>
              <div className="shots__row" style={{ "--count": c.images.length } as React.CSSProperties}>
                {c.images.map((img) => (
                  <Shot
                    key={img.src}
                    img={img}
                    phone={img.phone}
                    sizes={
                      c.images.length > 1
                        ? "(max-width: 679px) calc(100vw - 40px), 480px"
                        : "(max-width: 1119px) calc(100vw - 40px), 960px"
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ))}

      {next ? (
        <p className="col pt-16" data-reveal>
          <a href={`/work/${next.slug}`} className="text-link">
            Next project: {next.name} →
          </a>
        </p>
      ) : null}
    </SiteShell>
  );
}
