import { Section } from "@/components/blocks/Section";
import { SiteShell } from "@/components/layout/SiteShell";
import { homeLinks } from "@/components/layout/nav-links";

// Temporary test page for the shell; replaced by the real home in a later task.
export default function Home() {
  return (
    <SiteShell variant="home" links={homeLinks}>
      <h1 className="font-display text-4xl">destine jonathan</h1>
      <Section id="works" title="Works" hideNav>
        <div className="min-h-[120vh]">Works</div>
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
