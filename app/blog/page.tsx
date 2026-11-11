import type { Metadata } from "next";
import { PostRows } from "@/components/blog/PostRow";
import { PageHero } from "@/components/hero/PageHero";
import { SiteShell } from "@/components/layout/SiteShell";
import { getAllPosts, groupByYear } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing",
  description: "Notes on building fullstack apps and automations.",
};

export default async function BlogIndex() {
  const groups = groupByYear(await getAllPosts());
  const links = groups.map(([y]) => ({ href: `#y${y}`, label: y }));
  return (
    <SiteShell variant="index" links={links} back={{ href: "/", label: "← Home" }}>
      <PageHero
        variant="major"
        lead="Writing."
        statements={[["Notes on building fullstack apps and automations."]]}
      />
      {groups.map(([year, posts]) => (
        <section key={year} id={`y${year}`} className="scroll-mt-16 pb-10">
          <h2 className="pb-3 text-[13px] font-normal text-ink-faint">{year}</h2>
          <PostRows posts={posts} />
        </section>
      ))}
    </SiteShell>
  );
}
