import type { Metadata } from "next";
import { EducationList } from "@/components/blocks/Entries";
import { Section } from "@/components/blocks/Section";
import { Intro, Lead } from "@/components/hero/Lead";
import { SiteShell } from "@/components/layout/SiteShell";
import { education } from "@/content/experience";

export const metadata: Metadata = {
  title: "Education",
  description: "Courses and studies behind my work as a developer.",
};

export default function EducationPage() {
  return (
    <SiteShell current="/education">
      <Intro narrow>
        <Lead
          title="Education."
          statements={[
            ["An engineering background, then a frontend course that turned tinkering into shipping."],
            ["Most of what I know now, I learned by building."],
          ]}
        />
      </Intro>

      <Section
        id="studies"
        title="Studies"
        label
        more={{ href: "/experience", label: "Experience" }}
      >
        <EducationList items={education} full />
      </Section>
    </SiteShell>
  );
}
