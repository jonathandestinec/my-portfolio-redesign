import { Section } from "@/components/blocks/Section";
import { RowList } from "@/components/blocks/RowList";
import { ArrowLink } from "@/components/cta/ArrowLink";
import { CtaGroup } from "@/components/cta/CtaGroup";
import { InlineLink } from "@/components/cta/InlineLink";
import { ContribGrid } from "@/components/github/ContribGrid";
import { HandNote } from "@/components/hero/HandNote";
import { PageHero } from "@/components/hero/PageHero";
import { SiteShell } from "@/components/layout/SiteShell";
import { homeLinks } from "@/components/layout/nav-links";
import { ScrollBlur } from "@/components/motion/ScrollBlur";
import { StackGrid } from "@/components/stack/StackGrid";
import { WorkCarousel } from "@/components/work/WorkCarousel";
import { education, experience } from "@/content/experience";
import { site } from "@/content/site";
import { stack } from "@/content/stack";
import { homeSlides } from "@/lib/content";
import { getContributions } from "@/lib/github-cached";
import { formatDate, getAllPosts } from "@/lib/posts";

export default async function Home() {
  const [cal, posts] = await Promise.all([getContributions(), getAllPosts()]);
  const latest = posts.slice(0, 3);

  return (
    <SiteShell variant="home" links={homeLinks}>
      <PageHero
        variant="major"
        lead={site.hero.lead}
        statements={site.hero.statements}
        note={<HandNote text="check this out :)" arrow="up-left" />}
        actions={<CtaGroup />}
        status={site.hero.status}
      />

      <Section id="works" title="Works" hideNav>
        <WorkCarousel slides={homeSlides()} />
        <div className="mt-8">
          <ArrowLink href="/playground">Pet projects &amp; experiments</ArrowLink>
        </div>
      </Section>

      <Section id="experience" title="Experience">
        <ScrollBlur>
          <RowList
            rows={experience.map((r) => ({
              label: `${r.start} – ${r.end}`,
              title: `${r.title} · ${r.company}`,
              body: r.summary,
              aside: r.location ? (
                <span className="text-[13px] text-ink-faint">{r.location}</span>
              ) : undefined,
            }))}
          />
          <h3 className="mb-4 mt-12 text-[13px] text-ink-faint">Education</h3>
          <RowList
            rows={education.map((e) => ({
              label: e.date,
              title: `${e.course} · ${e.institution}`,
              aside: (
                <span className="text-[13px] text-ink-faint">{e.location}</span>
              ),
            }))}
          />
        </ScrollBlur>
      </Section>

      <Section id="stack" title="Stack">
        <ScrollBlur>
          <StackGrid items={stack} />
        </ScrollBlur>
      </Section>

      <Section id="activity" title="GitHub activity">
        <ScrollBlur>
          <ContribGrid cal={cal} />
        </ScrollBlur>
      </Section>

      <Section id="writing" title="Writing">
        <ScrollBlur>
          <RowList
            rows={latest.map((p) => ({
              label: formatDate(p.date, true),
              title: p.title,
              href: `/blog/${p.slug}`,
              aside: (
                <span className="text-[13px] text-ink-faint">
                  {p.readingMinutes} min
                </span>
              ),
            }))}
          />
          <div className="mt-6">
            <ArrowLink href="/blog">All writing</ArrowLink>
          </div>
        </ScrollBlur>
      </Section>

      <Section id="contact" title="Contact">
        <ScrollBlur>
          <p className="font-display text-[clamp(1.875rem,3vw,2.75rem)] font-medium leading-[1.2] tracking-[-0.02em] text-ink-muted">
            Have a role in mind? Let&apos;s talk.
          </p>
          <div className="mt-6">
            <CtaGroup id="cta-more-contact" />
          </div>
          <p className="mt-6 text-[15px] text-ink-muted">
            <InlineLink href={`mailto:${site.email}`}>{site.email}</InlineLink>
          </p>
        </ScrollBlur>
      </Section>

      <footer className="mt-8 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-6 text-[13px] text-ink-faint">
        <span>© 2026 Destine Jonathan</span>
        <span aria-hidden>·</span>
        <a href="/playground" className="hover:text-ink">
          Playground
        </a>
        <span aria-hidden>·</span>
        <a href="/blog/rss.xml" className="hover:text-ink">
          RSS
        </a>
      </footer>
    </SiteShell>
  );
}
