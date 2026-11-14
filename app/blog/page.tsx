import type { Metadata } from "next";
import { Section } from "@/components/blocks/Section";
import { PostRows } from "@/components/blog/PostRow";
import { Intro, Lead } from "@/components/hero/Lead";
import { SiteShell } from "@/components/layout/SiteShell";
import { getAllPosts, groupByYear } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing",
  description: "Notes on building fullstack apps and automations.",
};

export default async function BlogIndex() {
  const groups = groupByYear(await getAllPosts());
  return (
    <SiteShell current="/blog" sections={groups.map(([y]) => ({ href: `#y${y}`, label: y }))}>
      <Intro narrow>
        <Lead
          title="Writing."
          statements={[
            ["Notes on building fullstack apps and automations."],
            ["Mostly what broke, and how I fixed it."],
          ]}
        />
      </Intro>
      {groups.map(([year, posts]) => (
        <Section key={year} id={`y${year}`} title={year} label>
          <PostRows posts={posts} />
        </Section>
      ))}
    </SiteShell>
  );
}
