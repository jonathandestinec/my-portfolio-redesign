import type { Metadata } from "next";
import { Facts } from "@/components/blocks/Facts";
import { Section } from "@/components/blocks/Section";
import { Cta } from "@/components/cta/Actions";
import { Intro, Lead } from "@/components/hero/Lead";
import { SiteShell } from "@/components/layout/SiteShell";
import { resumeLink } from "@/components/layout/nav-links";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Book a call, send an email, or grab my résumé.",
};

const ext = { target: "_blank", rel: "noreferrer", className: "text-link" } as const;

export default function ContactPage() {
  return (
    <SiteShell current="/contact" closing={null}>
      <Intro narrow>
        <Lead
          title="Have a role in mind?"
          statements={[
            ["I'm looking for fullstack roles, remote or in Nigeria. A 15-minute call is the quickest way to see if we fit."],
          ]}
        >
          <Cta notes={site.hero.status} />
        </Lead>
      </Intro>

      <Section id="details" title="Ways to reach me" label>
        <Facts
          rows={[
            ["Call", <a key="c" href={site.calendarUrl} {...ext}>Book 15 minutes ↗</a>],
            ["Email", <a key="e" href={`mailto:${site.email}`} className="text-link">{site.email}</a>],
            ["Résumé", <a key="r" href={resumeLink.href} download className="text-link">Download PDF ↓</a>],
            ["GitHub", <a key="g" href={site.socials.github} {...ext}>{site.socials.github.replace("https://", "")} ↗</a>],
            ["LinkedIn", <a key="l" href={site.socials.linkedin} {...ext}>{site.socials.linkedin.replace("https://", "")} ↗</a>],
            ["X", <a key="x" href={site.socials.x} {...ext}>{site.socials.x.replace("https://", "")} ↗</a>],
            ["Based in", "Nigeria · works remotely across time zones"],
          ]}
        />
      </Section>
    </SiteShell>
  );
}
