import type { Metadata } from "next";
import { RoleList } from "@/components/blocks/Entries";
import { Section } from "@/components/blocks/Section";
import { Intro, Lead } from "@/components/hero/Lead";
import { SiteShell } from "@/components/layout/SiteShell";
import { experience } from "@/content/experience";

export const metadata: Metadata = {
  title: "Experience",
  description: "Where I've worked as a frontend and fullstack developer, and what I did there.",
};

const stackCount = new Set(experience.flatMap((r) => r.stack)).size;

export default function ExperiencePage() {
  return (
    <SiteShell current="/experience">
      <Intro narrow>
        <Lead
          title="Experience."
          statements={[
            ["Agency client work, product teams and programmes, mostly remote, since 2024."],
            ["Open any role to see what I did there and what I used."],
          ]}
        />
      </Intro>

      <Section
        id="roles"
        title="Roles"
        label
        sub={`${experience.length} roles · ${stackCount} tools across them`}
        more={{ href: "/education", label: "Education" }}
      >
        <RoleList roles={experience} full />
      </Section>
    </SiteShell>
  );
}
