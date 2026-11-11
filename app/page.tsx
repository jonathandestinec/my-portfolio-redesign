import Link from "next/link";
import { EducationList, RoleList } from "@/components/blocks/Entries";
import { Bleed, Section } from "@/components/blocks/Section";
import { PostRows } from "@/components/blog/PostRow";
import { Cta } from "@/components/cta/Actions";
import { ContribGrid } from "@/components/github/ContribGrid";
import { Intro, Lead } from "@/components/hero/Lead";
import { SiteShell } from "@/components/layout/SiteShell";
import { StackGrid } from "@/components/stack/StackGrid";
import { WorkCarousel } from "@/components/work/WorkCarousel";
import { education, experience } from "@/content/experience";
import { site } from "@/content/site";
import { stack } from "@/content/stack";
import { homeSlides } from "@/lib/content";
import { getContributions } from "@/lib/github-cached";
import { getAllPosts } from "@/lib/posts";

export default async function Home() {
  const [cal, posts] = await Promise.all([getContributions(), getAllPosts()]);

  return (
    <SiteShell current="/">
      <Intro narrow>
        <Lead title={site.hero.lead} statements={site.hero.statements}>
          <Cta notes={site.hero.status} />
        </Lead>
      </Intro>

      <Bleed id="works" label="Works">
        <WorkCarousel slides={homeSlides()} />
      </Bleed>
      <p className="col -mt-2" data-reveal>
        <Link href="/works" className="text-link">
          All works, pet projects &amp; experiments →
        </Link>
      </p>

      <Section
        id="experience"
        title="Experience"
        label
        more={{ href: "/experience", label: "More on my experience" }}
      >
        <RoleList roles={experience} />
      </Section>

      <Section
        id="education"
        title="Education"
        label
        more={{ href: "/education", label: "More on my education" }}
      >
        <EducationList items={education} />
      </Section>

      <Section
        id="stack"
        title="Stack"
        sub="What I reach for, day to day."
        more={{ href: "/stack", label: "How I use them" }}
      >
        <div className="cards">
          <div className="card">
            <div className="card__body">
              <StackGrid items={stack} />
            </div>
          </div>
          <div className="card">
            <div className="card__body">
              <span className="medium">GitHub activity</span>
              <div className="overflow-x-auto">
                <ContribGrid cal={cal} />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section
        id="writing"
        title="Writing"
        sub="Notes from building things."
        more={{ href: "/blog", label: "All writing" }}
      >
        <PostRows posts={posts.slice(0, 3)} summaries={false} />
      </Section>
    </SiteShell>
  );
}
