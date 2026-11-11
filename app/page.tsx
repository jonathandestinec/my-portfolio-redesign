import { Section } from "@/components/blocks/Section";
import { CtaGroup } from "@/components/cta/CtaGroup";
import { HandNote } from "@/components/hero/HandNote";
import { PageHero } from "@/components/hero/PageHero";
import { SiteShell } from "@/components/layout/SiteShell";
import { homeLinks } from "@/components/layout/nav-links";
import { site } from "@/content/site";
import { homeSlides } from "@/lib/content";
import { WorkCarousel } from "@/components/work/WorkCarousel";

// Temporary test page for the shell; replaced by the real home in a later task.
export default function Home() {
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
      </Section>
      <Section id="experience" title="Experience">
        <div className="min-h-[120vh]">Experience</div>
      </Section>
      <Section id="stack" title="Stack">
        <div className="min-h-[120vh]">Stack</div>
      </Section>
    </SiteShell>
  );
}
